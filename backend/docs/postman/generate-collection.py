"""Builds ChangeCars_All_APIs.postman_collection.json from the running API's OpenAPI spec.

    curl -s http://localhost:4000/docs/openapi.json -o /tmp/openapi.json
    python3 docs/postman/generate-collection.py /tmp/openapi.json ids.json

ids.json (optional) holds sample values for path variables, e.g. {"vehicleId": "..."}.
Every operation becomes a request with example query params and JSON bodies built from the
schemas. "Start here" logs in the three demo roles and stores their tokens; each folder then
uses the token of the role that endpoint needs.
"""
import json
import re
import sys
from collections import OrderedDict

spec = json.load(open(sys.argv[1]))
ids = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
schemas = spec.get('components', {}).get('schemas', {})
METHODS = ('get', 'post', 'put', 'patch', 'delete')


def resolve(schema):
    while isinstance(schema, dict) and '$ref' in schema:
        schema = schemas.get(schema['$ref'].split('/')[-1], {})
    return schema or {}


def example(schema, depth=0):
    schema = resolve(schema)
    if depth > 4:
        return None
    if 'example' in schema:
        return schema['example']
    if 'default' in schema:
        return schema['default']
    if 'enum' in schema:
        return schema['enum'][0]
    for key in ('allOf', 'oneOf', 'anyOf'):
        if key in schema:
            merged = {}
            for part in schema[key]:
                value = example(part, depth + 1)
                if isinstance(value, dict):
                    merged.update(value)
                elif value is not None and not merged:
                    return value
            return merged
    kind = schema.get('type')
    if kind == 'object' or 'properties' in schema:
        return {name: example(prop, depth + 1) for name, prop in schema.get('properties', {}).items()}
    if kind == 'array':
        item = example(schema.get('items', {}), depth + 1)
        return [] if item is None else [item]
    if kind == 'integer':
        return schema.get('minimum', 1) if schema.get('minimum', 0) > 0 else 1
    if kind == 'number':
        return schema.get('minimum', 1) if schema.get('minimum', 0) > 0 else 1
    if kind == 'boolean':
        return True
    if kind == 'string':
        fmt = schema.get('format')
        if fmt == 'email':
            return 'customer@example.com'
        if fmt == 'uuid':
            return '00000000-0000-0000-0000-000000000000'
        if fmt in ('date-time', 'date'):
            return '2026-12-01T09:00:00.000Z' if fmt == 'date-time' else '2026-12-01'
        if fmt == 'uri' or fmt == 'url':
            return 'https://example.com'
        return 'string'
    return None


def singular(word):
    word = word.replace('-', ' ').title().replace(' ', '')
    for plural, single in (('ies', 'y'), ('sses', 'ss'), ('ches', 'ch'), ('s', '')):
        if word.endswith(plural) and not word.endswith('ss'):
            return word[: -len(plural)] + single
    return word


def variable_for(path, name):
    """{id} becomes vehicleId / dealerId / ... from the segment before it; other names stay as they are."""
    if name not in ('id', 'slug'):
        return name
    if name == 'slug':
        before = path.split('/{slug}')[0].split('/')[-1]
        base = singular(before)
        return base[0].lower() + base[1:] + 'Slug'

    segments = [s for s in path.split('/') if s and not s.startswith('{')]
    before = path.split('/{id}')[0].split('/')[-1]
    base = singular(before)
    base = base[0].lower() + base[1:]
    if path.startswith('/api/v1/dealer/vehicles'):
        return 'dealerVehicleId'
    if path.startswith('/api/v1/me/') and before in ('enquiries', 'offers', 'sell-requests', 'sessions', 'notifications', 'saved-searches', 'documents'):
        return 'my' + base[0].upper() + base[1:] + 'Id'
    return base + 'Id' if segments else 'id'


def token_for(path, tag):
    if path.startswith('/api/v1/admin') or tag.startswith('Admin') or tag.startswith('Super admin') or tag.startswith('Website adapter: dashboards'):
        return 'adminToken'
    if path.startswith('/api/v1/dealer/') or tag.startswith('Dealer portal'):
        return 'dealerToken'
    return 'customerToken'


def request(method, path, op):
    tag = (op.get('tags') or ['Other'])[0]
    variables = {}
    url_path = path.replace('/api/v1', '{{apiPrefix}}', 1)
    for name in re.findall(r'\{(\w+)\}', path):
        var = variable_for(path, name)
        variables[var] = ids.get(var, '')
        url_path = url_path.replace('{' + name + '}', '{{' + var + '}}')
    query = []
    overrides = QUERY_OVERRIDES.get(path, {})
    for param in op.get('parameters', []):
        param = resolve(param)
        if param.get('in') != 'query':
            continue
        value = overrides.get(param['name'], example(param.get('schema', {})))
        query.append({
            'key': param['name'],
            'value': '' if value is None else (','.join(map(str, value)) if isinstance(value, list) else str(value).lower() if isinstance(value, bool) else str(value)),
            'description': param.get('description', ''),
            'disabled': not param.get('required', False) and param['name'] not in overrides,
        })
    raw = '{{baseUrl}}' + url_path
    item = {
        'name': f"{method.upper()} {path.replace('/api/v1', '')}" if not op.get('summary') else op['summary'][:120],
        'request': {
            'method': method.upper(),
            'header': [{'key': 'Accept', 'value': 'application/json'}],
            'url': {'raw': raw + ('?' + '&'.join(f"{q['key']}={q['value']}" for q in query if not q['disabled']) if any(not q['disabled'] for q in query) else ''),
                    'host': ['{{baseUrl}}'], 'path': [s for s in url_path.split('/') if s], 'query': query},
            'description': f"{method.upper()} {path}\n\n{op.get('description') or op.get('summary') or ''}".strip(),
        },
        'response': [],
    }
    body = (op.get('requestBody') or {}).get('content', {})
    if 'application/json' in body:
        value = example(body['application/json'].get('schema', {}))
        item['request']['header'].append({'key': 'Content-Type', 'value': 'application/json'})
        item['request']['body'] = {'mode': 'raw', 'raw': json.dumps(value if value is not None else {}, indent=2), 'options': {'raw': {'language': 'json'}}}
    elif 'multipart/form-data' in body:
        props = resolve(body['multipart/form-data'].get('schema', {})).get('properties', {})
        item['request']['body'] = {'mode': 'formdata', 'formdata': [
            {'key': k, 'type': 'file' if resolve(v).get('format') == 'binary' else 'text', 'value': '' if resolve(v).get('format') == 'binary' else str(example(v) or '')}
            for k, v in props.items()]}
    secured = 'security' in op
    item['request']['auth'] = {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{' + token_for(path, tag) + '}}', 'type': 'string'}]} if secured else {'type': 'noauth'}
    return tag, item, variables


def login(name, email_var, password_var, token_var):
    script = [
        'const data = pm.response.json();',
        'pm.test("logged in", () => pm.expect(data.accessToken).to.be.a("string"));',
        f'pm.collectionVariables.set("{token_var}", data.accessToken);',
        f'pm.collectionVariables.set("{token_var.replace("Token", "RefreshToken")}", data.refreshToken);',
    ]
    return {
        'name': name,
        'event': [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': script}}],
        'request': {
            'method': 'POST', 'auth': {'type': 'noauth'},
            'header': [{'key': 'Content-Type', 'value': 'application/json'}],
            'body': {'mode': 'raw', 'raw': json.dumps({'email': '{{' + email_var + '}}', 'password': '{{' + password_var + '}}'}, indent=2), 'options': {'raw': {'language': 'json'}}},
            'url': {'raw': '{{baseUrl}}{{apiPrefix}}/auth/login', 'host': ['{{baseUrl}}'], 'path': ['{{apiPrefix}}', 'auth', 'login']},
            'description': 'Logs in and stores the access token for the requests that need this role.',
        },
        'response': [],
    }


# Query values that must be real records for the request to work.
QUERY_OVERRIDES = {
    '/api/v1/vehicles/compare': {'ids': '{{vehicleId}},{{vehicleId2}}'},
    '/api/v1/catalogue/variants/compare': {'ids': '{{variantId}},{{variantId2}}'},
    '/api/v1/web/dashboard/inventory': {'dealerId': '{{dealerId}}'},
    '/api/v1/web/dashboard/leads': {'dealerId': '{{dealerId}}'},
}
FILTER_PATHS = ('/api/v1/vehicles/filters', '/api/v1/vehicles/facets', '/api/v1/vehicle-filters')
folders = OrderedDict()
filters = []
variables = {}
for path, ops in spec['paths'].items():
    for method, op in ops.items():
        if method not in METHODS:
            continue
        tag, item, used = request(method, path, op)
        variables.update(used)
        if method == 'get' and path.startswith(FILTER_PATHS):
            filters.append(item)
        folders.setdefault(tag, []).append(item)

colour_examples = []
for label, query in (('Colours (all public cars)', ''), ('Colours for Toyota', 'make=toyota'), ('Colours for used diesel bakkies', 'condition=USED&fuelType=DIESEL&category=bakkies')):
    colour_examples.append({
        'name': label,
        'request': {'method': 'GET', 'auth': {'type': 'noauth'}, 'header': [{'key': 'Accept', 'value': 'application/json'}],
                    'url': {'raw': '{{baseUrl}}{{apiPrefix}}/vehicles/filters/colours' + ('?' + query if query else ''), 'host': ['{{baseUrl}}'],
                            'path': ['{{apiPrefix}}', 'vehicles', 'filters', 'colours'],
                            'query': [{'key': k, 'value': v} for k, v in (pair.split('=') for pair in query.split('&') if pair)]},
                    'description': 'Colour options with car counts. Add any search filter to get the colours for that search only.'},
        'response': [],
    })

items = [
    {'name': '00 Start here: log in', 'description': 'Run these first. Each saves its token; every other request uses the token of the role it needs.',
     'item': [login('Log in as customer', 'customerEmail', 'customerPassword', 'customerToken'),
              login('Log in as dealer', 'dealerEmail', 'dealerPassword', 'dealerToken'),
              login('Log in as super admin', 'adminEmail', 'adminPassword', 'adminToken')]},
    {'name': '01 Filters & colours (vehicle search options)', 'description': 'Filter options with counts: colours, makes, models, variants, transmissions, fuel types, drives, plus the complete filter data and facets.',
     'item': colour_examples + filters},
]
for tag, entries in sorted(folders.items()):
    items.append({'name': tag, 'item': entries})

collection_vars = [
    {'key': 'baseUrl', 'value': 'http://localhost:4000'},
    {'key': 'apiPrefix', 'value': '/api/v1'},
    {'key': 'customerEmail', 'value': 'customer@example.com'}, {'key': 'customerPassword', 'value': 'Password123'},
    {'key': 'dealerEmail', 'value': 'owner@demo-dealer.co.za'}, {'key': 'dealerPassword', 'value': 'Password123'},
    {'key': 'adminEmail', 'value': 'admin@changecars.co.za'}, {'key': 'adminPassword', 'value': 'LocalAdmin123'},
    {'key': 'customerToken', 'value': ''}, {'key': 'dealerToken', 'value': ''}, {'key': 'adminToken', 'value': ''},
] + [{'key': k, 'value': ids.get(k, v)} for k, v in sorted({**variables, 'vehicleId2': '', 'variantId2': ''}.items())]

collection = {
    'info': {
        'name': 'ChangeCars API (all endpoints, localhost)',
        'description': 'Every ChangeCars API endpoint, generated from the OpenAPI spec of the running backend.\n\n'
                       '1. Start the backend (http://localhost:4000).\n2. Run "00 Start here" to log in as customer, dealer and super admin.\n'
                       '3. Use any request. Path variables (vehicleId, dealerId, ...) are collection variables pre-filled with sample local data.\n\n'
                       'Errors always use { statusCode, code, message, details?, requestId }. Lists use { data, meta: { page, pageSize, total, pageCount } }.',
        'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    'item': items,
    'variable': collection_vars,
}
out = sys.argv[3] if len(sys.argv) > 3 else 'docs/postman/ChangeCars_All_APIs.postman_collection.json'
json.dump(collection, open(out, 'w'), indent=2)
print(f'{sum(len(f["item"]) for f in items[2:])} endpoints in {len(items) - 2} folders, {len(filters) + len(colour_examples)} filter requests, {len(variables)} path variables -> {out}')
print('variables:', sorted(variables))
