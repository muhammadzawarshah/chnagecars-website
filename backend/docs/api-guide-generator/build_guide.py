"""Builds the ChangeCars Backend & API Integration Guide (PDF).

Inputs (same folder): openapi.json (live spec), access.json (route access metadata from the
compiled controllers), errors.json (error codes from source), samples.json (real responses).
"""
import json
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Flowable,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

sys.path.insert(0, str(Path(__file__).parent))
from summaries import SUMMARIES  # noqa: E402

HERE = Path(__file__).parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "ChangeCars_Backend_API_Guide.pdf"
spec = json.loads((HERE / "openapi.json").read_text(encoding="utf-8"))
access = json.loads((HERE / "access.json").read_text(encoding="utf-8"))
errors = json.loads((HERE / "errors.json").read_text(encoding="utf-8"))
samples = json.loads((HERE / "samples.json").read_text(encoding="utf-8"))

# ───────────────────────── fonts & styles ─────────────────────────
FONTS = "C:/Windows/Fonts/"
pdfmetrics.registerFont(TTFont("Body", FONTS + "segoeui.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONTS + "segoeuib.ttf"))
pdfmetrics.registerFont(TTFont("Mono", FONTS + "consola.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", FONTS + "consolab.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily  # noqa: E402

registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body", boldItalic="Body-Bold")
registerFontFamily("Mono", normal="Mono", bold="Mono-Bold", italic="Mono", boldItalic="Mono-Bold")

NAVY = colors.HexColor("#1B2B4B")
GOLD = colors.HexColor("#C49A4A")
INK = colors.HexColor("#222831")
MUTED = colors.HexColor("#5F6B7A")
LINE = colors.HexColor("#D5DBE5")
HEAD_BG = colors.HexColor("#EEF2F7")
CODE_BG = colors.HexColor("#F5F7FA")
NOTE_BG = colors.HexColor("#FFF8E8")
TIP_BG = colors.HexColor("#ECF6EF")
WARN_BG = colors.HexColor("#FDEEEE")
METHOD_COLORS = {
    "GET": colors.HexColor("#2E7D32"),
    "POST": colors.HexColor("#1565C0"),
    "PUT": colors.HexColor("#6A1B9A"),
    "PATCH": colors.HexColor("#E65100"),
    "DELETE": colors.HexColor("#C62828"),
}

S = {
    "body": ParagraphStyle("body", fontName="Body", fontSize=9.6, leading=13.6, textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("small", fontName="Body", fontSize=8.2, leading=11, textColor=INK),
    "smallMuted": ParagraphStyle("smallMuted", fontName="Body", fontSize=8, leading=10.5, textColor=MUTED),
    "cell": ParagraphStyle("cell", fontName="Body", fontSize=8.2, leading=10.6, textColor=INK),
    "cellBold": ParagraphStyle("cellBold", fontName="Body-Bold", fontSize=8.2, leading=10.6, textColor=NAVY),
    "cellMono": ParagraphStyle("cellMono", fontName="Mono", fontSize=7.8, leading=10.2, textColor=INK),
    "h1": ParagraphStyle("h1", fontName="Body-Bold", fontSize=20, leading=25, textColor=NAVY, spaceBefore=0, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Body-Bold", fontSize=13.5, leading=18, textColor=NAVY, spaceBefore=12, spaceAfter=6),
    "h3": ParagraphStyle("h3", fontName="Body-Bold", fontSize=11, leading=15, textColor=NAVY, spaceBefore=9, spaceAfter=4),
    "bullet": ParagraphStyle("bullet", fontName="Body", fontSize=9.6, leading=13.4, textColor=INK, leftIndent=13, bulletIndent=3, spaceAfter=2.5),
    "step": ParagraphStyle("step", fontName="Body", fontSize=9.6, leading=13.4, textColor=INK, leftIndent=16, bulletIndent=0, spaceAfter=3),
    "code": ParagraphStyle("code", fontName="Mono", fontSize=7.6, leading=9.6, textColor=INK),
    "epPath": ParagraphStyle("epPath", fontName="Mono-Bold", fontSize=9, leading=12, textColor=INK),
    "epSummary": ParagraphStyle("epSummary", fontName="Body", fontSize=9, leading=12.4, textColor=INK, spaceAfter=2),
    "epMeta": ParagraphStyle("epMeta", fontName="Body", fontSize=8, leading=10.8, textColor=MUTED),
    "tocTitle": ParagraphStyle("tocTitle", fontName="Body-Bold", fontSize=20, leading=25, textColor=NAVY, spaceAfter=12),
}
TOC_STYLES = [
    ParagraphStyle("toc0", fontName="Body-Bold", fontSize=10.5, leading=15, textColor=NAVY, spaceBefore=5),
    ParagraphStyle("toc1", fontName="Body", fontSize=9.2, leading=12.5, leftIndent=14, textColor=INK),
    ParagraphStyle("toc2", fontName="Body", fontSize=8.4, leading=11, leftIndent=28, textColor=MUTED),
]

PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X


def esc(text):
    return escape(str(text))


def c(text):
    """Inline code."""
    return f'<font face="Mono" color="#8A2350">{esc(text)}</font>'


def p(text, style="body"):
    return Paragraph(text, S[style])


def bullets(items, style="bullet"):
    return [Paragraph(item, S[style], bulletText="•") for item in items]


def steps(items):
    return [Paragraph(item, S["step"], bulletText=f"{index}.") for index, item in enumerate(items, 1)]


def table(rows, widths, header=True, mono_cols=(), bold_first=False, font=None):
    """rows: list of lists of str (markup allowed). widths: fractions of the content width."""
    data = []
    for r_index, row in enumerate(rows):
        cells = []
        for c_index, value in enumerate(row):
            if isinstance(value, Flowable):
                cells.append(value)
                continue
            if header and r_index == 0:
                style = S["cellBold"]
            elif c_index in mono_cols:
                style = S["cellMono"]
            elif bold_first and c_index == 0:
                style = S["cellBold"]
            else:
                style = S["cell"]
            cells.append(Paragraph(value, style))
        data.append(cells)
    t = Table(data, colWidths=[w * CONTENT_W for w in widths], repeatRows=1 if header else 0, spaceBefore=2, spaceAfter=6)
    style = [
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
    ]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), HEAD_BG))
    t.setStyle(TableStyle(style))
    return t


def box(flowables, background=NOTE_BG, border=GOLD):
    inner = Table([[f] for f in flowables], colWidths=[CONTENT_W - 10])
    inner.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    outer = Table([[inner]], colWidths=[CONTENT_W])
    outer.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("LINEBEFORE", (0, 0), (0, -1), 2.2, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return KeepTogether([Spacer(1, 3), outer, Spacer(1, 6)])


def note(title, text, kind="note"):
    background, border = {"note": (NOTE_BG, GOLD), "tip": (TIP_BG, colors.HexColor("#2E7D32")), "warn": (WARN_BG, colors.HexColor("#C62828"))}[kind]
    return box([p(f"<b>{esc(title)}</b>", "small"), p(text, "small")], background, border)


def wrap_code(text, width=104):
    out = []
    for line in text.splitlines():
        while len(line) > width:
            cut = line.rfind(" ", 0, width)
            cut = cut if cut > 40 else width
            out.append(line[:cut])
            line = "    " + line[cut:].lstrip()
        out.append(line)
    return "\n".join(out)


def code(text, title=None):
    lines = wrap_code(text).splitlines()
    rows = []
    for start in range(0, len(lines), 6):
        chunk = Preformatted(chr(10).join(lines[start:start + 6]), S["code"])
        # the title always stays with the first chunk of code
        rows.append([[p(f"<b>{esc(title)}</b>", "smallMuted"), chunk] if (title and start == 0) else chunk])
    t = Table(rows, colWidths=[CONTENT_W], splitByRow=1, spaceBefore=3, spaceAfter=7)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                ("BOX", (0, 0), (-1, -1), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, 0), 4),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 5),
            ]
        )
    )
    return t


def code_json(value, title=None, max_lines=None):
    text = json.dumps(value, indent=2, ensure_ascii=False)
    lines = text.splitlines()
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines] + ["  ... (shortened)"]
    return code("\n".join(lines), title)


class Heading(Paragraph):
    """Paragraph that registers itself in the table of contents and PDF outline."""

    def __init__(self, text, level, style):
        super().__init__(text, style)
        self.toc_level = level
        self.toc_text = re.sub("<[^>]+>", "", text)


def h1(text):
    return [PageBreak(), Heading(esc(text), 0, S["h1"]), HRule()]


def h2(text):
    return [CondPageBreak(60 * mm), Heading(esc(text), 1, S["h2"])]


def h3(text):
    return [CondPageBreak(30 * mm), Paragraph(esc(text), S["h3"])]


class HRule(Flowable):
    def __init__(self, width=CONTENT_W, color=GOLD, thickness=1.6, full=False):
        super().__init__()
        self.width, self.color, self.thickness, self.full = width, color, thickness, full

    def wrap(self, *_):
        return self.width, 2 if self.full else 8

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        if self.full:
            self.canv.line(0, 1, self.width, 1)
        else:
            self.canv.line(0, 6, 60, 6)


class MethodBadge(Flowable):
    def __init__(self, method):
        super().__init__()
        self.method = method

    def wrap(self, *_):
        return 44, 13

    def draw(self):
        self.canv.setFillColor(METHOD_COLORS.get(self.method, NAVY))
        self.canv.roundRect(0, 0, 42, 12.5, 2.5, stroke=0, fill=1)
        self.canv.setFillColor(colors.white)
        self.canv.setFont("Mono-Bold", 7.8)
        self.canv.drawCentredString(21, 3.5, self.method)


# ───────────────────────── document template ─────────────────────────
class GuideDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=MARGIN_X,
            rightMargin=MARGIN_X,
            topMargin=20 * mm,
            bottomMargin=18 * mm,
            title="ChangeCars Backend & API Integration Guide",
            author="ChangeCars Backend Team",
            subject="Backend overview and API reference for app developers",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="main")
        cover_frame = Frame(0, 0, PAGE_W, PAGE_H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="cover")
        self.addPageTemplates([PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover), PageTemplate(id="main", frames=[frame], onPage=draw_page)])

    def afterFlowable(self, flowable):
        if isinstance(flowable, Heading):
            key = f"h{id(flowable)}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.toc_text, key, level=flowable.toc_level, closed=flowable.toc_level > 0)
            self.notify("TOCEntry", (flowable.toc_level, flowable.toc_text, self.page, key))


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H * 0.42, PAGE_W, PAGE_H * 0.58, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H * 0.42 - 4, PAGE_W, 4, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.setFont("Body-Bold", 34)
    canvas.drawString(MARGIN_X, PAGE_H - 70 * mm, "CHANGECARS")
    canvas.setFillColor(colors.white)
    canvas.setFont("Body-Bold", 25)
    canvas.drawString(MARGIN_X, PAGE_H - 88 * mm, "Backend & API Integration Guide")
    canvas.setFont("Body", 13)
    canvas.setFillColor(colors.HexColor("#D9E1EE"))
    canvas.drawString(MARGIN_X, PAGE_H - 99 * mm, "How the platform works, and every API endpoint")
    canvas.drawString(MARGIN_X, PAGE_H - 106 * mm, "explained in simple English for app developers")
    y = PAGE_H * 0.42 - 26 * mm
    canvas.setFillColor(INK)
    canvas.setFont("Body-Bold", 11)
    canvas.drawString(MARGIN_X, y, "Written for")
    canvas.setFont("Body", 10.5)
    lines = [
        "Mobile app developers (Android, iOS, Flutter, React Native)",
        "Web frontend developers (customer site, dealer portal, admin panel)",
        "Backend developers, QA testers and technical project managers",
    ]
    for index, line in enumerate(lines):
        canvas.drawString(MARGIN_X + 4 * mm, y - (7 + index * 6.5) * mm, "•  " + line)
    y -= 36 * mm
    rows = [
        ("Version", "1.0"),
        ("Date", "6 October 2026"),
        ("API base path", "/api/v1"),
        ("Endpoints documented", str(sum(len(v) for v in spec["paths"].values()))),
        ("Stack", "NestJS 11  ·  Prisma 7  ·  PostgreSQL  ·  Redis  ·  S3 storage"),
    ]
    for index, (label, value) in enumerate(rows):
        canvas.setFont("Body-Bold", 9.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN_X, y - index * 6 * mm, label)
        canvas.setFont("Body", 9.5)
        canvas.setFillColor(INK)
        canvas.drawString(MARGIN_X + 45 * mm, y - index * 6 * mm, value)
    canvas.setFont("Body", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 14 * mm, "ChangeCars  |  Backend Engineering  |  Internal technical document")
    canvas.restoreState()


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, PAGE_H - 13 * mm, PAGE_W - MARGIN_X, PAGE_H - 13 * mm)
    canvas.setFont("Body-Bold", 7.8)
    canvas.setFillColor(GOLD)
    canvas.drawString(MARGIN_X, PAGE_H - 11 * mm, "CHANGECARS")
    canvas.setFont("Body", 7.8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X + 19 * mm, PAGE_H - 11 * mm, "Backend & API Integration Guide")
    canvas.drawRightString(PAGE_W - MARGIN_X, 10 * mm, f"Page {doc.page}")
    canvas.drawString(MARGIN_X, 10 * mm, "Version 1.0  ·  6 October 2026")
    canvas.restoreState()


# ───────────────────────── reference data ─────────────────────────
PROVINCES = [
    ("EASTERN_CAPE", "Eastern Cape"),
    ("FREE_STATE", "Free State"),
    ("GAUTENG", "Gauteng"),
    ("KWAZULU_NATAL", "KwaZulu-Natal"),
    ("LIMPOPO", "Limpopo"),
    ("MPUMALANGA", "Mpumalanga"),
    ("NORTHERN_CAPE", "Northern Cape"),
    ("NORTH_WEST", "North West"),
    ("WESTERN_CAPE", "Western Cape"),
]

DEALER_PERMISSIONS = [
    ("DEALER_PROFILE_MANAGE", "Edit dealership profile, upload verification documents"),
    ("BRANCHES_MANAGE", "Add and edit branches"),
    ("STAFF_MANAGE", "Create, change and disable staff accounts"),
    ("INVENTORY_VIEW", "See the vehicle inventory"),
    ("INVENTORY_MANAGE", "Create and edit vehicles, photos, submit, reserve, sell, suspend, archive"),
    ("INVENTORY_PUBLISH", "Publish approved vehicles"),
    ("ENQUIRIES_VIEW", "See customer enquiries"),
    ("ENQUIRIES_RESPOND", "Reply to customer enquiries"),
    ("LEADS_VIEW_ALL", "See all leads (otherwise only leads assigned to me)"),
    ("LEADS_MANAGE_ALL", "Change any lead"),
    ("LEADS_MANAGE_ASSIGNED", "Change leads assigned to me"),
    ("LEADS_ASSIGN", "Assign leads to staff"),
    ("BIDDING_VIEW", "See vehicles open for bidding and my offers"),
    ("BIDDING_PARTICIPATE", "Submit, revise and withdraw offers"),
    ("REPORTS_VIEW", "See reports"),
]
ROLE_PERMS = {
    "OWNER": {name for name, _ in DEALER_PERMISSIONS},
    "MANAGER": {name for name, _ in DEALER_PERMISSIONS} - {"DEALER_PROFILE_MANAGE"},
    "SALES": {"INVENTORY_VIEW", "ENQUIRIES_VIEW", "ENQUIRIES_RESPOND", "LEADS_MANAGE_ASSIGNED", "BIDDING_VIEW"},
    "STAFF": {"INVENTORY_VIEW", "LEADS_MANAGE_ASSIGNED"},
}

NOTIFICATION_TYPES = [
    ("enquiry.new", "Dealer staff or admins", "A new enquiry arrived"),
    ("enquiry.response", "Customer", "A dealer or the ChangeCars team replied"),
    ("lead.assigned", "Dealer staff", "A lead was assigned to me"),
    ("valuation.ready", "Customer", "My vehicle valuation is ready"),
    ("bidding.opened", "Dealer staff", "A new vehicle is open for offers"),
    ("offer.new", "Customer", "A dealer made or updated an offer"),
    ("offer.countered", "Dealer staff", "The customer sent a counter-offer"),
    ("offer.counter_response", "Customer", "The dealer accepted or declined my counter-offer"),
    ("offer.accepted", "Customer and dealer", "An offer was accepted"),
    ("offer.rejected", "Dealer staff", "My offer was rejected, or another offer was accepted"),
    ("offer.expired", "Customer and dealer", "An offer expired"),
    ("offer.withdrawn", "Customer", "A dealer withdrew an offer"),
    ("vehicle.status", "Dealer staff", "A listing was approved, rejected, suspended, released..."),
    ("vehicle.review_requested", "Admins", "A listing is waiting for review"),
    ("saved_search.match", "Customer", "A new vehicle (or price drop) matches my saved search"),
    ("favourite.price_drop", "Customer", "A saved vehicle dropped in price"),
    ("favourite.status", "Customer", "A saved vehicle was reserved or sold"),
    ("dealer.application", "Admins", "A new dealer registered"),
    ("dealer.status", "Dealer owner", "My dealership was approved, rejected or suspended"),
    ("dealer.staff_invited", "Staff member", "I was added to a dealership (email invite)"),
]

STATUS_TABLES = [
    (
        "Vehicle status (lifecycle)",
        [
            ("DRAFT", "Being prepared by the dealer. Not visible to the public."),
            ("PENDING_REVIEW", "Submitted. Waiting for an admin to check it."),
            ("APPROVED", "Checked by an admin. The dealer can now publish it."),
            ("REJECTED", "Not approved. reviewNotes explains why. The dealer can fix and resubmit."),
            ("PUBLISHED", "Live on the website and in search results."),
            ("RESERVED", "Still visible, but marked as reserved for a buyer. Expires automatically."),
            ("SOLD", "Sold. Removed from search. Detail page still works for old links."),
            ("SUSPENDED", "Temporarily offline (by the dealer or an admin)."),
            ("ARCHIVED", "Removed. Kept only for history."),
        ],
    ),
    (
        "Vehicle availability (what to show the customer)",
        [
            ("AVAILABLE", "Show 'Available'. Enquiries allowed."),
            ("RESERVED", "Show a 'Reserved' badge. Enquiries still allowed (backup buyers)."),
            ("SOLD", "Show 'Sold'. Hide enquiry and finance buttons."),
            ("TEMPORARILY_UNAVAILABLE", "Listing is suspended."),
            ("ARCHIVED / NOT_LISTED", "Not for sale. Only seen in dealer and admin tools."),
        ],
    ),
    ("Vehicle condition", [("NEW", "New vehicle"), ("USED", "Pre-owned vehicle"), ("DEMO", "Dealer demonstrator")]),
    ("Fuel type", [("PETROL", "Petrol"), ("DIESEL", "Diesel"), ("HYBRID", "Hybrid"), ("PLUGIN_HYBRID", "Plug-in hybrid"), ("ELECTRIC", "Electric"), ("LPG", "LPG"), ("OTHER", "Other")]),
    ("Transmission", [("MANUAL", "Manual"), ("AUTOMATIC", "Automatic")]),
    ("Drivetrain", [("FWD", "Front-wheel drive"), ("RWD", "Rear-wheel drive"), ("AWD", "All-wheel drive"), ("FOUR_X_TWO", "4x2"), ("FOUR_X_FOUR", "4x4")]),
    ("Province", PROVINCES),
    (
        "Enquiry type",
        [
            ("VEHICLE", "Contact dealer about a listed vehicle"),
            ("TEST_DRIVE", "Test drive booking"),
            ("QUOTE", "Quote request for a (new) vehicle"),
            ("BEAT_MY_QUOTE", "Beat My Quote request"),
            ("TRADE_IN", "Trade-in request"),
            ("CONCIERGE", "Concierge service request"),
            ("HELP_ME_FIND", "Help me find a vehicle"),
            ("FINANCE", "Finance enquiry"),
            ("INSURANCE", "Insurance quote request"),
            ("GENERAL", "Contact us message"),
        ],
    ),
    (
        "Enquiry status",
        [
            ("NEW", "Received, nobody replied yet"),
            ("IN_PROGRESS", "Being handled, or the customer sent a follow-up"),
            ("RESPONDED", "The dealer or team replied"),
            ("CLOSED", "Finished"),
            ("CANCELLED", "Cancelled by the customer"),
        ],
    ),
    (
        "Lead stage (dealer CRM)",
        [
            ("NEW", "New lead, not contacted yet"),
            ("CONTACTED", "Dealer contacted the customer (set automatically on first reply)"),
            ("QUALIFIED", "Serious buyer with a real need and budget"),
            ("NEGOTIATION", "Discussing price and terms"),
            ("OFFER_SENT", "A formal offer was sent"),
            ("WON", "Deal done"),
            ("LOST", "Lost. lostReason is required"),
        ],
    ),
    (
        "Lead source",
        [
            ("WEBSITE_ENQUIRY", "Vehicle, test drive, finance or insurance enquiry"),
            ("QUOTE_REQUEST", "Quote or Beat My Quote"),
            ("TRADE_IN", "Trade-in request"),
            ("OFFER_ACCEPTED", "Customer accepted this dealer's offer on their car"),
            ("PHONE / WHATSAPP / EMAIL / WALK_IN / OTHER", "Created manually by the dealer"),
        ],
    ),
    ("Sell request type", [("SELL", "Customer wants dealer offers"), ("VALUATION", "Customer only wants to know the value")]),
    (
        "Sell request status",
        [
            ("SUBMITTED", "Received. Automatic valuation is running"),
            ("UNDER_REVIEW", "Waiting for the ChangeCars team (manual valuation or offers requested)"),
            ("VALUED", "A valuation is available"),
            ("BIDDING", "Dealers are making offers"),
            ("OFFER_ACCEPTED", "The customer accepted an offer. A deal exists"),
            ("COMPLETED", "The sale is finished"),
            ("CANCELLED", "Cancelled by the customer or team"),
            ("REJECTED", "Not accepted by the team"),
        ],
    ),
    ("Vehicle condition grade (sell requests)", [("EXCELLENT", "Like new"), ("GOOD", "Normal wear"), ("FAIR", "Visible wear or small issues"), ("POOR", "Needs work")]),
    (
        "Bidding session status",
        [
            ("SCHEDULED", "Opens in the future"),
            ("OPEN", "Dealers can bid now"),
            ("CLOSED", "Bidding time ended. Existing offers can still be accepted until they expire"),
            ("AWARDED", "An offer was accepted"),
            ("CANCELLED", "Cancelled"),
        ],
    ),
    (
        "Offer status",
        [
            ("SUBMITTED", "New offer from a dealer"),
            ("UPDATED", "The dealer changed the amount or terms"),
            ("PENDING", "The customer sent a counter-offer. Waiting for the dealer"),
            ("ACCEPTED", "The customer accepted it"),
            ("REJECTED", "The customer rejected it (or bidding was cancelled)"),
            ("EXPIRED", "Its validity time ended"),
            ("WITHDRAWN", "The dealer withdrew it"),
            ("SUPERSEDED", "Another offer was accepted"),
        ],
    ),
    ("Counter-offer status", [("OPEN", "Waiting for the dealer"), ("ACCEPTED", "Dealer accepted; offer amount updated"), ("DECLINED", "Dealer declined"), ("CANCELLED", "No longer relevant")]),
    ("Dealer status", [("PENDING", "Registered, waiting for admin approval"), ("APPROVED", "Can publish listings and bid"), ("REJECTED", "Application rejected"), ("SUSPENDED", "Blocked by an admin")]),
    ("Dealer member role", [("OWNER", "Dealership owner. All permissions"), ("MANAGER", "Manages inventory, staff and leads"), ("SALES", "Handles enquiries and assigned leads"), ("STAFF", "Basic access to assigned leads")]),
    ("Platform user role", [("CUSTOMER", "Normal user"), ("DEALER", "Belongs to a dealership"), ("ADMIN", "ChangeCars team member"), ("SUPER_ADMIN", "Full control, manages admins")]),
    ("Content status", [("DRAFT", "Not public"), ("PUBLISHED", "Public (from publishedAt)"), ("ARCHIVED", "Hidden")]),
    ("Article type", [("NEWS", "News"), ("REVIEW", "Vehicle review"), ("ADVICE", "Car-buying advice"), ("GUIDE", "Guide"), ("ARTICLE", "General article")]),
    ("Media type", [("VIDEO", "Video"), ("PODCAST", "Podcast")]),
]

TAG_GROUPS = [
    (
        "Public and customer APIs",
        "Used by the customer mobile app and the public website. Endpoints marked Public need no login.",
        [
            "Health",
            "Auth",
            "Catalogue",
            "Vehicles (public)",
            "Finance",
            "Enquiries (public forms)",
            "Sell / value your vehicle",
            "Dealers (public)",
            "Content (public)",
            "Newsletter",
            "SEO",
            "Customer: account & dashboard",
            "Notifications",
            "Customer: enquiries",
            "Customer: my vehicles for sale",
            "Customer: offers",
        ],
    ),
    (
        "Dealer portal APIs",
        "Used by the dealer app or dealer portal. The signed-in user must be an active member of a dealership. The required dealer permission is shown on each endpoint.",
        [
            "Dealer portal: account",
            "Dealer portal: dashboard",
            "Dealer portal: inventory",
            "Dealer portal: enquiries",
            "Dealer portal: CRM",
            "Dealer portal: bidding",
        ],
    ),
    (
        "Admin panel APIs",
        "Used by the ChangeCars admin panel. Requires the ADMIN or SUPER_ADMIN role.",
        [
            "Admin: dealers",
            "Admin: vehicles",
            "Admin: catalogue",
            "Admin: enquiries",
            "Admin: sell requests",
            "Admin: bidding",
            "Admin: content",
            "Admin: newsletter",
            "Admin: users, statistics, audit, system",
        ],
    ),
]

TAG_INTRO = {
    "Health": "Probes for load balancers and uptime monitors. Not under /api/v1.",
    "Auth": "Sign up, sign in, tokens and passwords. See chapter 5 for the full token flow.",
    "Catalogue": "Makes, models, variants, specifications, categories and features. Changes rarely, so cache it in the app.",
    "Vehicles (public)": "Search, filters, vehicle pages, compare and related vehicles.",
    "Finance": "Finance and affordability calculators. No login needed.",
    "Enquiries (public forms)": "All customer request forms. Login is optional; when the user is signed in the enquiry appears in their dashboard.",
    "Sell / value your vehicle": "Start a valuation or a sell request.",
    "Dealers (public)": "Dealer directory, dealer pages and dealer registration.",
    "Content (public)": "Articles, videos, podcasts, FAQs, static pages and promotions.",
    "Newsletter": "Subscribe and unsubscribe.",
    "SEO": "Sitemaps and structured data for the website.",
    "Customer: account & dashboard": "Profile, dashboard, favourites, saved searches, history, devices, privacy.",
    "Notifications": "In-app notifications and notification settings.",
    "Customer: enquiries": "The customer's own enquiries and conversations.",
    "Customer: my vehicles for sale": "The customer's valuations and sell requests.",
    "Customer: offers": "Dealer offers on the customer's vehicles: accept, reject, counter.",
}


def method_order(method):
    return ["GET", "POST", "PUT", "PATCH", "DELETE"].index(method) if method in ["GET", "POST", "PUT", "PATCH", "DELETE"] else 9


def resolve(schema):
    if schema and "$ref" in schema:
        return spec["components"]["schemas"][schema["$ref"].split("/")[-1]]
    if schema and "allOf" in schema and len(schema["allOf"]) == 1:
        return resolve(schema["allOf"][0])
    return schema or {}


def type_label(schema):
    schema = schema or {}
    if "$ref" in schema or ("allOf" in schema):
        return "object"
    if schema.get("enum"):
        return "enum"
    kind = schema.get("type", "any")
    if kind == "array":
        items = schema.get("items", {})
        if "$ref" in items:
            return "array of objects"
        if items.get("enum"):
            return "array of enum"
        return f"array of {items.get('type', 'any')}"
    if schema.get("format") in ("email", "date-time", "uuid", "uri"):
        return f"{kind} ({schema['format']})"
    return kind


def rules_text(schema, description=None):
    schema = schema or {}
    parts = []
    enum = schema.get("enum") or (schema.get("items") or {}).get("enum")
    if enum:
        values = ", ".join(str(v) for v in enum)
        parts.append(f"One of: {c(values)}")
    for key, label in (("minLength", "min length"), ("maxLength", "max length"), ("minimum", "min"), ("maximum", "max"), ("maxItems", "max items"), ("minItems", "min items")):
        if key in schema:
            parts.append(f"{label} {schema[key]}")
    if "default" in schema:
        parts.append(f"default {c(json.dumps(schema['default']))}")
    text = esc(description or schema.get("description") or "")
    if parts:
        text = (text + ". " if text else "") + "; ".join(parts)
    if "example" in schema and not enum:
        text = (text + ". " if text else "") + "e.g. " + c(json.dumps(schema["example"], ensure_ascii=False))
    return text or "&nbsp;"


def body_rows(schema, prefix="", depth=0):
    schema = resolve(schema)
    rows = []
    required = set(schema.get("required", []))
    for name, prop in (schema.get("properties") or {}).items():
        full = f"{prefix}{name}"
        rows.append([c(full), esc(type_label(prop)), "Yes" if name in required else "No", rules_text(resolve(prop) if "$ref" in prop else prop, prop.get("description"))])
        if depth < 2:
            if "$ref" in prop or "allOf" in prop:
                rows.extend(body_rows(prop, full + ".", depth + 1))
            elif prop.get("type") == "array" and "$ref" in (prop.get("items") or {}):
                rows.extend(body_rows(prop["items"], full + "[].", depth + 1))
    return rows


def access_text(key, operation):
    info = access.get(key, {})
    if info.get("public"):
        label = "Public (no login)"
    elif info.get("optionalAuth"):
        label = "Public. Login optional (when signed in, the request is linked to the user)"
    elif info.get("roles"):
        roles = info["roles"]
        label = "Super admin only" if roles == ["SUPER_ADMIN"] else "Admin (ADMIN or SUPER_ADMIN)"
    elif info.get("dealer") is not None:
        d = info["dealer"]
        parts = ["Dealer member"]
        if d.get("permissions"):
            parts.append("permission " + " + ".join(d["permissions"]))
        if d.get("anyPermission"):
            parts.append("any of " + ", ".join(d["anyPermission"]))
        if d.get("requireApproved"):
            parts.append("dealership must be APPROVED")
        if d.get("allowInactive"):
            parts.append("works even if the dealership is pending, suspended or rejected")
        label = ", ".join(parts)
    else:
        label = "Signed-in user (any role)"
    extra = []
    if info.get("throttle"):
        extra.append(f"Rate limit {info['throttle']['limit']} requests per minute per IP")
    if info.get("idempotent"):
        extra.append("Supports the Idempotency-Key header")
    if info.get("publicCache"):
        extra.append(f"Anonymous responses are CDN-cacheable for {info['publicCache']} s")
    return label, extra


def clean_summary(text):
    text = re.sub(r"\s*\((?:FR|NFR|BR)-[^)]*\)", "", text or "")
    text = re.sub(r"\s*\(brief[^)]*\)", "", text)
    return text.strip()


def endpoint_block(method, path, operation):
    key = f"{method} {path}"
    summary = clean_summary(operation.get("summary")) or SUMMARIES.get(key, "")
    if summary and not summary.endswith("."):
        summary += "."
    label, extra = access_text(key, operation)
    success = ", ".join(sorted(k for k in (operation.get("responses") or {}).keys() if k.startswith("2"))) or "200"

    head = Table([[MethodBadge(method), Paragraph(esc(path), S["epPath"])]], colWidths=[48, CONTENT_W - 48])
    head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    parts = [head, Spacer(1, 3)]
    if summary:
        parts.append(Paragraph(esc(summary), S["epSummary"]))
    meta = f"<b>Access:</b> {esc(label)}.  <b>Success:</b> {success}."
    if extra:
        meta += "  " + esc(". ".join(extra)) + "."
    parts.append(Paragraph(meta, S["epMeta"]))

    params = operation.get("parameters") or []
    flow = [KeepTogether(parts)]
    if params:
        rows = [["Parameter", "In", "Type", "Required", "Notes"]]
        for param in params:
            schema = param.get("schema") or {}
            rows.append([c(param["name"]), esc(param["in"]), esc(type_label(schema)), "Yes" if param.get("required") else "No", rules_text(schema, param.get("description"))])
        flow += [Spacer(1, 3), table(rows, [0.2, 0.08, 0.13, 0.09, 0.5])]
    body = (((operation.get("requestBody") or {}).get("content") or {}).get("application/json") or {}).get("schema")
    if body:
        rows = body_rows(body)
        if rows:
            flow += [Spacer(1, 3), table([["Body field", "Type", "Required", "Rules and notes"]] + rows, [0.27, 0.15, 0.09, 0.49])]
    return flow + [Spacer(1, 5), HRule(CONTENT_W, LINE, 0.4, full=True), Spacer(1, 7)]


def sample(name):
    return samples[name]


# ───────────────────────── story ─────────────────────────
story = [NextPageTemplate("main"), PageBreak()]

toc = TableOfContents()
toc.levelStyles = TOC_STYLES
toc.dotsMinLevel = 0
story += [Paragraph("Contents", S["tocTitle"]), toc]

# 1. About
story += h1("1. About this guide")
story += [
    p(
        "ChangeCars is an online marketplace for buying and selling vehicles in South Africa. Customers search new and used cars, contact dealers, ask for quotes, compare vehicles, use finance calculators and sell or value their own car. Dealers manage their stock, leads and staff, and bid on cars that customers want to sell. The ChangeCars team manages dealers, listings, content and enquiries."
    ),
    p("This guide explains the backend that powers all of this. It has two goals:"),
]
story += bullets(
    [
        "Explain <b>how the backend works</b>: the main ideas, rules and flows, in simple English.",
        "Give <b>every API endpoint</b> with its access rules, parameters and request fields, so an app developer can connect a mobile app, website, dealer portal or admin panel without reading the backend code.",
    ]
)
story += h2("1.1 Who should read what")
story.append(
    table(
        [
            ["Reader", "Read these chapters"],
            ["Mobile app developer (customer app)", "3, 4, 5, then 6.1 to 6.8, chapter 7 and the Public and customer part of chapter 8"],
            ["Web developer (public website)", "Same as the mobile developer, plus 6.11 (content and SEO)"],
            ["Dealer portal / dealer app developer", "3, 4, 5, 6.9 and the Dealer portal part of chapter 8"],
            ["Admin panel developer", "3, 4, 5, 6.10 and the Admin part of chapter 8"],
            ["Backend developer, DevOps", "Everything, especially chapter 2 and chapter 9"],
            ["QA tester", "Chapters 4 to 7 and appendix A (error codes)"],
        ],
        [0.36, 0.64],
        bold_first=True,
    )
)
story += h2("1.2 Words used in this guide")
story.append(
    table(
        [
            ["Word", "Meaning"],
            ["Visitor", "Someone using the app or website without signing in."],
            ["Customer", "A signed-in user who buys or sells a car."],
            ["Dealer / dealership", "A car dealer business registered on ChangeCars. It can have several branches."],
            ["Dealer member (staff)", "A user who works for a dealership. Has a role (owner, manager, sales, staff) and permissions."],
            ["Admin, super admin", "People from the ChangeCars team. A super admin can also manage other admins."],
            ["Vehicle / listing", "A car offered for sale by a dealer."],
            ["Catalogue", "The list of makes, models, generations, variants and their specifications, for example BMW > 3 Series > G20 > 320i."],
            ["Enquiry", "A message or request from a customer: contact dealer, quote, trade-in, finance, and so on."],
            ["Lead", "A potential sale in a dealer's CRM. Most enquiries create a lead automatically."],
            ["Sell request", "A customer's request to value or sell their own car."],
            ["Valuation", "An estimated trade value for the customer's car, automatic or done by the team."],
            ["Bidding session", "A time window in which dealers can make offers on a customer's car."],
            ["Offer, counter-offer", "A dealer's price for the customer's car; the customer can answer with a higher counter-offer."],
            ["Deal", "Created when a customer accepts an offer."],
            ["Slug", "A readable id used in URLs, for example 2022-bmw-3-series-320i-x7k2pq."],
            ["Access token, refresh token", "The two tokens the app receives after sign-in. See chapter 5."],
            ["Worker", "A background process that sends emails, notifications and alerts and processes images."],
        ],
        [0.26, 0.74],
        bold_first=True,
    )
)

# 2. System at a glance
story += h1("2. The system at a glance")
story += h2("2.1 Technology")
story.append(
    table(
        [
            ["Part", "Technology", "Why"],
            ["API server", "Node.js 20+, NestJS 11, TypeScript", "Clear module structure, validation, OpenAPI documentation"],
            ["Database", "PostgreSQL with Prisma 7", "The single source of truth for all business data"],
            ["Cache and limits", "Redis", "Fast cache, shared rate limits, view counters across many servers"],
            ["File storage", "S3-compatible storage (AWS S3, Cloudflare R2, MinIO)", "Vehicle photos and documents never live on the server disk"],
            ["Background work", "Worker process with a database outbox", "Emails, notifications, alerts and image processing never slow down a request"],
            ["Images", "sharp", "Photos are resized to 320, 800 and 1600 px WebP; location data is removed"],
        ],
        [0.18, 0.36, 0.46],
        bold_first=True,
    )
)
story += h2("2.2 How a request travels")
story.append(
    code(
        "App / website\n"
        "   |\n"
        "   v\n"
        "CDN + firewall  (caches public, anonymous GET responses)\n"
        "   |\n"
        "   v\n"
        "Load balancer / Nginx\n"
        "   |\n"
        "   v\n"
        "API servers (1..N, all identical, no local state)\n"
        "   |-----> PostgreSQL (primary, plus optional read replica for search)\n"
        "   |-----> Redis (cache, rate limits, view counters)\n"
        "   |-----> Object storage (photos, documents)\n"
        "\n"
        "Worker servers (1..N)  -> read the outbox table -> send email/SMS/in-app notifications,\n"
        "                          process photos, run valuations, expire offers, release reservations"
    )
)
story += [
    Spacer(1, 6),
    p(
        "Every API server is the same and keeps nothing in memory between requests. So any server can answer any request, and more servers can be added when traffic grows. Public pages such as search results and vehicle pages are cacheable by the CDN, so most browsing traffic never reaches the API."
    ),
]
story += h2("2.3 The two processes")
story += bullets(
    [
        f"<b>API</b> ({c('node dist/main.js')}): answers HTTP requests.",
        f"<b>Worker</b> ({c('node dist/worker.js')}): does background work. When something happens (for example a new enquiry), the API saves an event in the database in the same step as the change. The worker picks it up and sends the notifications. If sending fails, the worker retries with growing delays. This is why some results, such as a valuation or an email, arrive a few seconds after the request.",
    ]
)
story += h2("2.4 Modules")
story.append(
    table(
        [
            ["Module", "What it does"],
            ["Auth", "Registration, login, tokens, passwords"],
            ["Customers", "Profile, dashboard, favourites, saved searches, recently viewed, privacy"],
            ["Dealers", "Dealer registration and approval, profile, branches, staff and permissions"],
            ["Catalogue", "Makes, models, generations, variants, specifications, categories, features"],
            ["Vehicles", "Dealer inventory, listing lifecycle, photos, public vehicle pages"],
            ["Search", "Filters, sorting, collections, facets, saved-search alerts"],
            ["Enquiries", "All customer request forms and conversations"],
            ["CRM", "Dealer leads, stages, assignment, contact history"],
            ["Selling", "Sell requests and valuations"],
            ["Bidding", "Dealer bidding, offers, counter-offers, acceptance, deals"],
            ["Finance", "Repayment and affordability calculators"],
            ["Content", "Articles, videos, podcasts, FAQs, static pages, promotions"],
            ["Newsletter", "Subscriptions"],
            ["Notifications", "In-app notifications, email, SMS, user preferences"],
            ["Dealer dashboard", "Summary numbers for dealers"],
            ["Admin", "Users, statistics, audit log, background job health"],
            ["SEO", "Sitemaps and structured data"],
            ["Health", "Liveness and readiness checks"],
        ],
        [0.22, 0.78],
        bold_first=True,
    )
)

# 3. Getting started
story += h1("3. Getting started")
story += h2("3.1 Base URL and documentation")
story.append(
    table(
        [
            ["Environment", "Base URL", "Notes"],
            ["Local (developer machine)", c("http://localhost:4000/api/v1"), "Run the backend yourself (see the backend README)"],
            ["Staging", c("https://<staging-host>/api/v1"), "Address provided by the backend team"],
            ["Production", c("https://<production-host>/api/v1"), "Address provided by the backend team"],
        ],
        [0.22, 0.42, 0.36],
        bold_first=True,
    )
)
story += [Spacer(1, 6)]
story += bullets(
    [
        f"<b>Interactive docs (Swagger UI):</b> {c('/docs')}. You can try every endpoint in the browser. Click <i>Authorize</i> and paste an access token to call protected endpoints.",
        f"<b>OpenAPI file:</b> {c('/docs/openapi.json')}. Use it to generate a typed API client, for example with openapi-generator (Kotlin/Retrofit, Swift, Dart) or openapi-typescript (TypeScript).",
        f"<b>Health checks:</b> {c('/health/live')} and {c('/health/ready')} (outside {c('/api/v1')}).",
    ]
)
story.append(note("Swagger in production", "Interactive docs can be switched off in production with SWAGGER_ENABLED=false. Ask the backend team for a copy of openapi.json if it is not exposed."))
story += h2("3.2 Test accounts (demo data)")
story.append(p("When the backend team loads the demo data, these accounts exist. All use the password <b>Password123</b> except the admin, whose password is chosen when the data is loaded."))
story.append(
    table(
        [
            ["Role", "Email", "Use it to test"],
            ["Super admin", c("admin@changecars.co.za"), "Admin panel"],
            ["Dealer owner", c("owner@demo-dealer.co.za"), "Dealer portal with all permissions"],
            ["Dealer sales staff", c("sales@demo-dealer.co.za"), "Dealer portal with limited permissions"],
            ["Customer", c("customer@example.com"), "Customer app"],
        ],
        [0.22, 0.4, 0.38],
        bold_first=True,
    )
)
story += h2("3.3 Your first calls")
story.append(p("1. Search vehicles (public, no login):"))
story.append(code('curl "http://localhost:4000/api/v1/vehicles?make=toyota&fuelType=DIESEL&sort=price-asc"'))
story.append(p("2. Create an account. The response contains the tokens:"))
story.append(
    code(
        'curl -X POST http://localhost:4000/api/v1/auth/register \\\n'
        '  -H "Content-Type: application/json" \\\n'
        '  -d \'{"email":"sipho@example.com","password":"Secret123","firstName":"Sipho",\n'
        '       "lastName":"Dlamini","phone":"+27 82 555 0101","acceptTerms":true}\''
    )
)
story.append(p("3. Call a protected endpoint with the access token:"))
story.append(code('curl http://localhost:4000/api/v1/me/dashboard \\\n  -H "Authorization: Bearer <accessToken>"'))

# 4. Rules every request follows
story += h1("4. Rules every request follows")
story += h2("4.1 Data format")
story.append(
    table(
        [
            ["Topic", "Rule"],
            ["Format", f"JSON in and out, UTF-8. Send {c('Content-Type: application/json')} with a body. Maximum body size 1 MB."],
            ["Field names", f"camelCase, for example {c('firstName')}, {c('vehicleId')}."],
            ["Ids", f"UUID strings, for example {c('01a1124c-58d2-7a3e-9b1f-2c7d5e0f4a11')}. Vehicles, dealers, articles, promotions and media also have a {c('slug')} for nice URLs."],
            ["Dates and times", f"ISO 8601 in UTC, for example {c('2026-10-06T17:26:35.115Z')}. Convert to local time in the app (South Africa is UTC+2). Send dates in the same format."],
            ["Money", "Whole South African rand as integers (no cents), for example price 459900 means R459 900. Only finance calculator results contain cents."],
            ["Distances and sizes", "Mileage in km, engine in cc, power in kW, torque in Nm, dimensions in mm, fuel consumption in litres per 100 km."],
            ["Fixed values (enums)", f"UPPER_CASE strings, for example {c('PUBLISHED')}, {c('GAUTENG')}. All values are listed in chapter 7."],
            ["Unknown fields", "Rejected. Sending a field the API does not know returns 400 VALIDATION_FAILED. This protects against typos."],
            ["Text cleaning", "Leading and trailing spaces are removed. Emails are stored in lower case."],
        ],
        [0.2, 0.8],
        bold_first=True,
    )
)
story += h2("4.2 Lists and paging")
story.append(p(f"Every list endpoint is paged. Send {c('page')} (starts at 1) and {c('pageSize')} (default 20, maximum 100; vehicle search maximum 50). The response always looks like this:"))
story.append(code_json({"data": ["... items ..."], "meta": {"page": 1, "pageSize": 20, "total": 134, "pageCount": 7}}))
story.append(p(f"Use {c('meta.pageCount')} to know when to stop loading more (infinite scroll), and {c('meta.total')} to show result counts."))
story += h2("4.3 Errors")
story.append(p("Every error has the same shape. Your app should decide what to do based on <b>code</b> (stable, machine-readable) and may show <b>message</b> to the user. Always log <b>requestId</b>; the backend team can find the exact request with it."))
story.append(code_json(sample("errorAuth")["response"], "Example: wrong password (401)"))
story.append(code_json(sample("errorValidation")["response"], "Example: validation error (400). details lists every problem", max_lines=20))
story.append(
    table(
        [
            ["HTTP status", "Meaning", "What the app should do"],
            ["400", "The request is wrong (validation, bad values)", "Show the field errors from details. Do not retry."],
            ["401", "Not signed in, or the access token expired", "Refresh the token once, then retry. If refresh fails, go to the sign-in screen."],
            ["403", "Signed in but not allowed", "Hide the action, or explain why (for example the dealership is not approved yet)."],
            ["404", "Not found (or you may not see it)", "Show a not-found screen."],
            ["409", "Conflict with the current state", "Reload the data and show the message, for example 'This offer has expired'."],
            ["422", "Valid request but a business rule is not met", "Show the message, for example 'Upload at least one photo first'."],
            ["429", "Too many requests", "Wait a few seconds and try again with a growing delay."],
            ["500 / 503", "Server problem", "Show a friendly error and allow retry. Report the requestId."],
        ],
        [0.14, 0.38, 0.48],
        bold_first=True,
    )
)
story.append(p("All error codes are listed in appendix A."))
story += h2("4.4 Request id")
story.append(p(f"Every response has an {c('X-Request-Id')} header. You may also send your own {c('X-Request-Id')} (8 to 100 letters, digits, dot, dash or underscore) to follow one user action across app logs and server logs."))
story += h2("4.5 Rate limits")
story.append(p("Limits protect the platform against abuse. They count requests per IP address per minute:"))
story.append(
    table(
        [
            ["Endpoints", "Limit"],
            ["Most endpoints", "300 requests per minute (configurable)"],
            ["Login, register, reset password", "10 per minute"],
            ["Forgot password, dealer registration, newsletter subscribe", "5 per minute"],
            ["Refresh token", "30 per minute"],
            ["Enquiry forms and sell requests", "10 per minute"],
        ],
        [0.6, 0.4],
        bold_first=True,
    )
)
story += h2("4.6 Caching")
story.append(p(f"Public, anonymous GET responses (search, vehicle pages, catalogue, content, dealers, sitemaps) include {c('Cache-Control: public, s-maxage=...')}. The CDN and the app's HTTP client may cache them. Public data may therefore be up to about one minute old (catalogue up to one hour). Responses to signed-in requests always carry {c('Cache-Control: private, no-store')}. Before any money or status action (enquiry, offer, accept) the server always checks the latest data, so cached data can never cause a wrong transaction."))
story += h2("4.7 Safe retries (Idempotency-Key)")
story.append(
    p(
        f"Accepting an offer is important and must never happen twice. Send a header {c('Idempotency-Key: <uuid>')} with a new random UUID for each user tap. If the network fails and you retry with the <b>same key</b>, the server returns the first result instead of doing the action again. Keys are kept for 24 hours. Using the same key with a different request body returns 422 IDEMPOTENCY_KEY_REUSED."
    )
)
story += h2("4.8 Editing safely (versions)")
story.append(p(f"Vehicles and offers have a {c('version')} number. When you edit, you can send {c('expectedVersion')} with the version you loaded. If someone else changed the record in the meantime, the server returns 409 STALE_VERSION and you should reload and show the latest data."))

# 5. Authentication
story += h1("5. Sign-in, tokens and permissions")
story += h2("5.1 The two tokens")
story.append(
    table(
        [
            ["Token", "Lifetime", "How to use it"],
            ["Access token (JWT)", "15 minutes", f"Send on every protected request: {c('Authorization: Bearer <accessToken>')}"],
            ["Refresh token", "30 days, single use", f"Send to {c('POST /auth/refresh')} to get a new pair. Each refresh token works only once."],
        ],
        [0.22, 0.2, 0.58],
        bold_first=True,
    )
)
story.append(p("Register and login both return the same response:"))
story.append(code_json(sample("register")["response"], "POST /auth/register response (201)"))
story += h2("5.2 Keeping the user signed in")
story += steps(
    [
        "Save both tokens in secure storage: iOS Keychain / Android Keystore (for example flutter_secure_storage or expo-secure-store). On the web, keep the access token in memory and protect the refresh token carefully.",
        "Add the access token to every request.",
        f"When a request returns <b>401</b> with code {c('INVALID_TOKEN')}, call {c('POST /auth/refresh')} with the refresh token.",
        "Save the <b>new</b> access and refresh tokens from the response (the old refresh token is now dead), then retry the original request once.",
        "If refresh returns 401 or 403, clear the tokens and show the sign-in screen.",
    ]
)
story.append(
    note(
        "Important: only one refresh at a time",
        "If two requests fail together, refresh once and let the other requests wait for the result. Using the same refresh token twice is treated as token theft: the server signs the user out on all devices (code INVALID_REFRESH_TOKEN). You can also refresh a little before expiresIn runs out.",
        "warn",
    )
)
story.append(
    code(
        "// Pseudo-code for an HTTP interceptor\n"
        "let refreshing = null;\n"
        "async function request(options) {\n"
        "  let res = await send(options, accessToken);\n"
        "  if (res.status === 401 && res.body.code === 'INVALID_TOKEN') {\n"
        "    refreshing ??= refreshTokens().finally(() => (refreshing = null)); // one refresh only\n"
        "    const ok = await refreshing;\n"
        "    if (!ok) return goToSignIn();\n"
        "    res = await send(options, accessToken);\n"
        "  }\n"
        "  return res;\n"
        "}"
    )
)
story += h2("5.3 Who is signed in")
story.append(p(f"After sign-in, call {c('GET /auth/me')}. It returns the user and, for dealer staff, the dealership and member role. Use {c('role')} to decide which app or portal to show. Dealer apps can call {c('GET /dealer/me')} to get the exact permission list:"))
story.append(code_json(sample("dealerMe")["response"], "GET /dealer/me (dealer owner)"))
story += h2("5.4 Passwords")
story += bullets(
    [
        "Passwords need 8 to 128 characters with at least one letter and one number.",
        f"<b>Forgot password:</b> {c('POST /auth/forgot-password')} always answers 202, even for unknown emails (so nobody can test which emails exist). The user gets an email with a link to {c('<website>/reset-password?token=...')}. The app or website reads the token and calls {c('POST /auth/reset-password')}. The link works for 60 minutes. After a reset, all devices are signed out.",
        f"<b>Change password</b> (signed in): {c('POST /auth/change-password')}. Other devices are signed out; this one stays signed in.",
        f"<b>Staff invitations:</b> new dealer staff and new admins receive the same reset-password link (with {c('&invite=1')}), valid for 7 days, to choose their first password.",
        f"<b>Sign out:</b> {c('POST /auth/logout')} (this device) or {c('POST /auth/logout-all')} (all devices). Then delete the stored tokens.",
    ]
)
story += h2("5.5 Platform roles")
story.append(
    table(
        [
            ["Role", "Can do"],
            ["Visitor (not signed in)", "Search and view vehicles, read content, use calculators, send enquiries, start a valuation, register"],
            ["CUSTOMER", "Everything a visitor can, plus dashboard, favourites, saved searches, alerts, enquiry tracking, sell requests and offers"],
            ["DEALER", "Dealer portal according to the member's dealership permissions"],
            ["ADMIN", "Admin panel: dealers, listings, catalogue, content, enquiries, bidding, users, statistics"],
            ["SUPER_ADMIN", "Everything an admin can, plus creating admins and changing user roles"],
        ],
        [0.24, 0.76],
        bold_first=True,
    )
)
story += h2("5.6 Dealer roles and permissions")
story.append(p("Each dealership member has a role with default permissions. An owner or manager can give extra permissions to a member, but never a permission they do not have themselves. Members of a branch (sales, staff) only see vehicles, enquiries and leads of their own branch."))
perm_rows = [["Permission", "Allows", "Owner", "Manager", "Sales", "Staff"]]
for name, desc in DEALER_PERMISSIONS:
    perm_rows.append([c(name), esc(desc)] + ["Yes" if name in ROLE_PERMS[role] else "-" for role in ("OWNER", "MANAGER", "SALES", "STAFF")])
story.append(table(perm_rows, [0.27, 0.41, 0.08, 0.09, 0.075, 0.075]))
story.append(
    note(
        "Dealership status matters",
        "A PENDING dealership can sign in, edit its profile, add branches and staff and create draft vehicles, but cannot submit listings for review, publish or bid until an admin approves it (code DEALER_NOT_APPROVED). A SUSPENDED or REJECTED dealership can only view its profile and dashboard (code DEALER_INACTIVE).",
    )
)

# 6. Feature guides
story += h1("6. Feature guides")
story.append(p("This chapter explains each feature as a list of steps with the endpoints to call. Full details of every endpoint are in chapter 8."))

story += h2("6.1 Search and vehicle pages")
story.append(p(f"{c('GET /vehicles')} returns published and reserved vehicles from approved dealers. All filters are optional and can be combined. Filters with several values take a comma-separated list; a vehicle matches if it has any of the values."))
story.append(
    table(
        [
            ["Parameter", "Meaning", "Example"],
            [c("q"), "Words in the title (all words must match)", c("q=hilux legend")],
            [c("make"), "Make slugs", c("make=bmw,audi")],
            [c("model"), "Model slugs. Use make:model to limit a model to one make", c("make=bmw,toyota&model=toyota:hilux")],
            [c("variant"), "Variant slugs", c("variant=320i-2022")],
            [c("condition"), "NEW, USED, DEMO", c("condition=USED")],
            [c("category"), "Category slugs (body type, EV, hybrid...)", c("category=suvs,double-cabs")],
            [c("fuelType / transmission / drivetrain"), "Values from chapter 7", c("fuelType=DIESEL,PETROL")],
            [c("province / city"), "Location", c("province=GAUTENG")],
            [c("colour"), "Colours", c("colour=White,Black")],
            [c("dealer / branchId"), "One dealer (slug) or branch (id)", c("dealer=sandton-auto")],
            [c("minPrice / maxPrice"), "Price range in rand", c("maxPrice=400000")],
            [c("minYear / maxYear"), "Model year range", c("minYear=2020")],
            [c("minMileage / maxMileage"), "Mileage range in km", c("maxMileage=80000")],
            [c("minEngineCc / maxEngineCc, minPowerKw / maxPowerKw"), "Engine size and power", c("minPowerKw=100")],
            [c("seats"), "Seat counts, 8+ means eight or more", c("seats=7,8+")],
            [c("onSpecial / featured / availableOnly"), "Only specials, only featured, hide reserved", c("availableOnly=true")],
            [c("lat, lng, radiusKm"), "Vehicles within a distance of a point", c("lat=-26.1&lng=28.05&radiusKm=25")],
            [c("collection"), "Ready-made lists: hot-sellers, specials, featured, new-arrivals, budget, student, bakkies, electric", c("collection=bakkies")],
            [c("sort"), "recent, oldest, price-asc, price-desc, mileage-asc, mileage-desc, year-desc, year-asc, popular", c("sort=price-asc")],
            [c("page / pageSize"), "Paging (pageSize max 50)", c("page=2&pageSize=20")],
        ],
        [0.33, 0.4, 0.27],
    )
)
story.append(Spacer(1, 6))
story.append(code_json(sample("search")["response"], "GET " + sample("search")["path"].replace("/api/v1", "") + " (one result shown)", max_lines=70))
story += bullets(
    [
        f"<b>Show the price:</b> use {c('effectivePrice')}. If {c('discount')} is not null, show the old {c('price')} crossed out (vehicle on special).",
        f"<b>Show the status:</b> use {c('availability')} (AVAILABLE, RESERVED, SOLD...). See chapter 7.",
        f"<b>Images:</b> {c('primaryImageUrl')} is the medium-size main photo for list cards.",
        f"<b>Filter counts:</b> {c('GET /vehicles/facets')} accepts the same filters and returns counts per make, fuel, transmission, province, condition and category, plus min/max price, year and mileage for range sliders.",
        f"<b>Specials and hot sellers:</b> {c('GET /vehicles/specials')} and {c('GET /vehicles/hot-sellers')} (sorted by popularity).",
    ]
)
story += h3("Vehicle page")
story.append(p(f"{c('GET /vehicles/{slugOrId}')} accepts the slug or the id. It returns photos in three sizes, full specifications, features (each with STANDARD or OPTIONAL and where it comes from), dealer and branch (with opening hours), and an example finance repayment. Signed-in users automatically get the vehicle added to their recently viewed list."))
story.append(code_json(sample("detail")["response"], "GET /vehicles/{slug} (shortened)", max_lines=95))
story += bullets(
    [
        f"{c('canEnquire')} is false for sold vehicles: hide the enquiry buttons.",
        f"{c('finance')} is an example with 10% deposit, 72 months and 11.75% interest. Let users change it with the finance calculator.",
        f"Related calls: {c('/vehicles/{id}/similar')}, {c('/vehicles/{id}/dealer-vehicles')}, {c('/vehicles/{id}/market-price')} (average price of comparable cars) and {c('/vehicles/compare?ids=a,b,c')} (2 to 4 vehicles).",
        f"For SEO the website can embed {c('/seo/vehicles/{slug}/structured-data')} (schema.org JSON-LD).",
    ]
)

story += h2("6.2 Catalogue (makes, models, variants)")
story.append(p("Use the catalogue for make/model dropdowns, the new-vehicle flow and specification pages. It changes rarely, so cache it in the app for a day."))
story += steps(
    [
        f"{c('GET /catalogue/makes')} for the list of makes.",
        f"{c('GET /catalogue/makes/{makeSlug}/models')} for the models of a make.",
        f"{c('GET /catalogue/makes/{makeSlug}/models/{modelSlug}')} for generations and variants with specifications and list prices (new vehicles).",
        f"{c('GET /catalogue/variants/{id}')} for one variant with all specifications and features; {c('GET /catalogue/variants/compare?ids=...')} to compare variants.",
        f"To ask for a price, send a quote request: {c('POST /enquiries/quote')} (see 6.4).",
    ]
)
story.append(code_json(sample("makes")["response"], "GET /catalogue/makes (two of the results)"))
story.append(p(f"{c('GET /catalogue/categories')} returns the vehicle categories (hatchbacks, sedans, SUVs, crossovers, coupés, convertibles, bakkies, super cabs, king cabs, double cabs, MPVs, motorbikes, electric, hybrid). Use their slugs in the {c('category')} search filter."))

story += h2("6.3 Favourites, saved searches, alerts and history")
story.append(
    table(
        [
            ["Feature", "Endpoints", "Notes"],
            ["Save a vehicle", f"{c('PUT /me/favourites/{vehicleId}')}, {c('DELETE /me/favourites/{vehicleId}')}", "Safe to call twice. Saved on the server, so it works on every device."],
            ["Heart icons", c("GET /me/favourites/ids"), "Load once after sign-in to mark saved vehicles in lists."],
            ["Favourites list", c("GET /me/favourites"), "Paged, with current availability."],
            ["Saved searches", f"{c('GET/POST /me/saved-searches')}, {c('PATCH/DELETE /me/saved-searches/{id}')}", "Store the same filters as GET /vehicles in criteria. Up to 25 per user."],
            ["Alerts", "Automatic", "With alertsEnabled=true the user is notified about new matching vehicles, price drops and vehicles that become available again."],
            ["Recently viewed", f"{c('GET /me/recently-viewed')}, {c('DELETE /me/recently-viewed')}", "Filled automatically when a signed-in user opens a vehicle page. Last 50 kept."],
        ],
        [0.17, 0.43, 0.4],
        bold_first=True,
    )
)
story.append(code_json({"name": "Diesel double cabs under R600k", "criteria": {"fuelType": "DIESEL", "category": "double-cabs", "maxPrice": 600000, "province": "GAUTENG"}, "alertsEnabled": True}, "POST /me/saved-searches body"))

story += h2("6.4 Enquiries and customer requests")
story.append(p(f"All forms share four contact fields: {c('name')}, {c('email')}, {c('phone')} and {c('consent')}. The consent must be <b>true</b> (the user agrees to be contacted, as required by POPIA). Login is optional, but when the user is signed in, send the token so the request appears in their dashboard."))
story.append(
    table(
        [
            ["Endpoint", "Use for", "Extra fields", "Who handles it"],
            [c("POST /enquiries/vehicle"), "Contact dealer about a vehicle", "vehicleId, message, interestedInFinance, hasTradeIn", "The vehicle's dealer (lead created)"],
            [c("POST /enquiries/test-drive"), "Book a test drive", "vehicleId, preferredAt, message", "The vehicle's dealer (lead created)"],
            [c("POST /enquiries/quote"), "Quote for a vehicle", "makeId, modelId, variantId, dealerId, province, requirements", "Chosen dealer, else the ChangeCars team"],
            [c("POST /enquiries/beat-my-quote"), "Beat an existing quote", "desiredVehicle, quotedPrice, quotingDealer, quoteDetails, province", "ChangeCars team"],
            [c("POST /enquiries/trade-in"), "Trade in while buying", "vehicleId or desiredVehicle, tradeIn {make, model, year, mileage, condition...}", "Vehicle's dealer, else the team"],
            [c("POST /enquiries/concierge"), "Concierge service", "services[], budget, province, notes", "ChangeCars team"],
            [c("POST /enquiries/help-me-find"), "Find a vehicle for me", "makeId, modelId, vehicleType, budgetMin, budgetMax, minYear, maxMileage, province, preferences", "ChangeCars team"],
            [c("POST /enquiries/finance"), "Finance interest", "vehicleId, vehiclePrice, deposit, termMonths, monthlyIncome, employmentStatus", "Vehicle's dealer, else the team"],
            [c("POST /enquiries/insurance"), "Insurance quote", "vehicleId, vehicleDescription, coverType, province", "ChangeCars team"],
            [c("POST /enquiries/contact"), "Contact us", "subject, message", "ChangeCars team"],
        ],
        [0.25, 0.17, 0.36, 0.22],
    )
)
story.append(Spacer(1, 5))
story.append(code_json(sample("enquiry")["request"], "POST /enquiries/vehicle body"))
story.append(code_json(sample("enquiry")["response"], "Response (201). Show the reference to the user"))
story += bullets(
    [
        f"If the same email sends the same request again within 10 minutes, the first enquiry is returned with {c('duplicate: true')}. Show it as a success.",
        f"Enquiries for sold, suspended or archived vehicles are refused with 409 {c('VEHICLE_NOT_AVAILABLE')}.",
        f"The customer receives a confirmation email. Signed-in customers follow replies in {c('GET /me/enquiries')}, can reply with {c('POST /me/enquiries/{id}/reply')} and cancel with {c('POST /me/enquiries/{id}/cancel')}.",
    ]
)

story += h2("6.5 Finance calculators")
story.append(code_json(sample("finance")["request"], "POST /finance/repayment body"))
story.append(code_json(sample("finance")["response"], "Response"))
story.append(p(f"{c('POST /finance/affordability')} takes monthlyIncome, monthlyExpenses, deposit, termMonths, annualInterestRate and optional balloonPercent. It returns the maximum monthly repayment (capped at 30% of income and at disposable income) and an estimated vehicle budget, with a list of assumptions to show under the result."))

story += h2("6.6 Sell or value my car")
story.append(p("This is the full journey from 'what is my car worth?' to an accepted dealer offer."))
story += steps(
    [
        f"<b>Submit the car.</b> {c('POST /sell-requests')} with contact details, province and vehicle details. Send catalogue ids (makeId, modelId, variantId) when possible; otherwise makeName and modelName. type=VALUATION for a value only, SELL for dealer offers.",
        "<b>Valuation.</b> The worker calculates an automatic valuation within seconds when there is enough market data. The user gets a valuation.ready notification. Without enough data the request goes to UNDER_REVIEW and the team adds a manual valuation.",
        f"<b>Photos (optional, signed-in users).</b> {c('POST /me/sell-requests/{id}/images/upload-url')}, then PUT the file to the returned URL, then confirm with {c('POST /me/sell-requests/{id}/images')}.",
        f"<b>Ask for offers.</b> {c('POST /me/sell-requests/{id}/request-offers')}. The team opens a bidding session for approved dealers.",
        f"<b>Receive offers.</b> Dealers bid. The user gets offer.new notifications. Show offers from {c('GET /me/offers')} or {c('GET /me/sell-requests/{id}')}: dealer name and rating, amount, terms and expiry time.",
        f"<b>Answer offers.</b> Accept with {c('POST /me/offers/{id}/accept')} (send an Idempotency-Key), reject with {c('POST /me/offers/{id}/reject')}, or counter with a higher amount using {c('POST /me/offers/{id}/counter')} (when the session allows it).",
        "<b>Deal.</b> After acceptance all other offers become SUPERSEDED, the request becomes OFFER_ACCEPTED, a deal is created and the dealer contacts the customer.",
    ]
)
story.append(code_json(sample("sellRequest")["request"], "POST /sell-requests body"))
story.append(code_json(sample("sellRequest")["response"], "Response (201)"))
story.append(
    note(
        "Accepting an offer can fail for good reasons",
        "The server checks the offer again at the moment of acceptance. Show the message for these codes and reload the offers: OFFER_EXPIRED, OFFER_WITHDRAWN, OFFER_REJECTED, OFFER_SUPERSEDED, ALREADY_AWARDED, BIDDING_CANCELLED. Only one offer per car can ever be accepted, even if two taps happen at the same time.",
    )
)

story += h2("6.7 Notifications")
story += bullets(
    [
        "Notifications are delivered in the app (in-app list), by email and, when a provider is configured, by SMS.",
        f"Show a badge with {c('GET /me/notifications/unread-count')}. Poll it when the app comes to the foreground and every one or two minutes while open.",
        f"List with {c('GET /me/notifications')} (use unreadOnly=true for unread only). Mark as read with {c('POST /me/notifications/{id}/read')} or {c('POST /me/notifications/read-all')}.",
        f"Each notification has {c('type')}, {c('title')}, {c('body')} and {c('data')} (ids such as vehicleId, slug, offerId, enquiryId). Use type and data to open the right screen.",
        f"Users choose channels per type with {c('GET/PUT /me/notifications/preferences')}. Defaults: in-app and email on, SMS off.",
        "Push notifications (FCM / APNs) are not built yet; see chapter 9.",
    ]
)
story.append(code_json({"id": "01a1124c-...", "userId": "01a11242-...", "type": "offer.new", "title": "You received a new offer", "body": "Sandton Auto offers R495 000 for your 2022 BMW 3 Series. Valid until 2026-10-08T17:30:00.000Z.", "data": {"offerId": "01a1125a-...", "sellRequestId": "01a11250-..."}, "readAt": None, "createdAt": "2026-10-06T17:30:00.000Z"}, "One notification"))
story.append(table([["Type", "Sent to", "When"]] + [[c(t), esc(w), esc(d)] for t, w, d in NOTIFICATION_TYPES], [0.3, 0.22, 0.48]))

story += h2("6.8 Customer account and privacy")
story += bullets(
    [
        f"<b>Profile:</b> {c('GET /me')} and {c('PATCH /me')} (name, phone, marketing consent).",
        f"<b>Dashboard:</b> {c('GET /me/dashboard')} returns counts and the latest enquiries, sell requests and recently viewed vehicles in one call.",
        f"<b>Devices:</b> {c('GET /me/sessions')} lists signed-in devices; {c('DELETE /me/sessions/{id}')} signs one out.",
        f"<b>Download my data:</b> {c('GET /me/export')}.",
        f"<b>Delete account:</b> {c('POST /me/delete-account')} with the current password. Personal data is anonymised and the user is signed out everywhere.",
    ]
)
story.append(code_json(sample("dashboard")["response"], "GET /me/dashboard (shortened)", max_lines=60))

story += h2("6.9 Dealer portal")
story += h3("Registration and approval")
story += steps(
    [
        f"{c('POST /dealers/register')} with an owner object (account details) and a dealership object (business name, contact, province, city, address and optional registration numbers). The response contains tokens, so the owner is signed in at once.",
        f"The dealership starts as PENDING. Upload verification documents: {c('POST /dealer/documents/upload-url')}, PUT the file, then {c('POST /dealer/documents')}.",
        "An admin approves or rejects the application. The owner gets a dealer.status notification.",
    ]
)
story += h3("Branches and staff")
story += bullets(
    [
        f"Branches: {c('GET/POST /dealer/branches')}, {c('PATCH /dealer/branches/{id}')} with address, coordinates and opening hours.",
        f"Staff: {c('POST /dealer/staff')} creates the account and emails an invitation. Change role, branch, extra permissions or disable with {c('PATCH /dealer/staff/{memberId}')}. Only the owner can manage managers.",
    ]
)
story += h3("Vehicle lifecycle")
story.append(p("A listing moves through fixed states. The server refuses any other move with 409 INVALID_STATUS_TRANSITION and returns the allowed moves in details."))
story.append(
    table(
        [
            ["Action", "Endpoint (dealer)", "From", "To", "Notes"],
            ["Create", c("POST /dealer/vehicles"), "-", "DRAFT", "Specs are filled from the catalogue variant"],
            ["Submit", c("POST .../{id}/submit"), "DRAFT, REJECTED", "PENDING_REVIEW", "Dealership approved; at least one photo"],
            ["Withdraw", c("POST .../{id}/withdraw"), "PENDING_REVIEW", "DRAFT", ""],
            ["Approve / reject", "Admin only", "PENDING_REVIEW", "APPROVED / REJECTED", "Reject needs a reason"],
            ["Publish", c("POST .../{id}/publish"), "APPROVED", "PUBLISHED", "Needs INVENTORY_PUBLISH"],
            ["Reserve", c("POST .../{id}/reserve"), "PUBLISHED", "RESERVED", "Default 72 hours, then released automatically"],
            ["Release", c("POST .../{id}/release"), "RESERVED", "PUBLISHED", ""],
            ["Sell", c("POST .../{id}/sell"), "PUBLISHED, RESERVED", "SOLD", "Leaves search results"],
            ["Suspend", c("POST .../{id}/suspend"), "PUBLISHED, RESERVED", "SUSPENDED", "If an admin suspended it, only an admin can undo it"],
            ["Unsuspend", c("POST .../{id}/unsuspend"), "SUSPENDED", "PUBLISHED", ""],
            ["Back to draft", c("POST .../{id}/edit"), "REJECTED, APPROVED, PUBLISHED, SUSPENDED", "DRAFT", "To change make, model, year, mileage..."],
            ["Archive", c("POST .../{id}/archive"), "Most states", "ARCHIVED", "Removes the listing"],
        ],
        [0.13, 0.22, 0.2, 0.17, 0.28],
    )
)
story.append(
    note(
        "What can be edited after approval",
        f"In DRAFT and REJECTED everything can be edited. After approval, {c('PATCH /dealer/vehicles/{id}')} only accepts price, specialPrice, isSpecial, description, colour, branchId, stockNumber, featureIds and promotionId. Other fields return 409 MATERIAL_CHANGE_REQUIRES_REVIEW: move the vehicle back to draft first. A lower price on a live vehicle notifies customers who saved it.",
        "tip",
    )
)
story += h3("Uploading vehicle photos")
story += steps(
    [
        f"{c('POST /dealer/vehicles/{id}/images/upload-url')} with contentType (image/jpeg, image/png or image/webp) and sizeBytes (max 15 MB). Max 40 photos per vehicle.",
        "PUT the file bytes to uploadUrl with the returned Content-Type header. The file goes straight to storage, not through the API.",
        f"{c('POST /dealer/vehicles/{id}/images/{imageId}/complete')}. The image status becomes PROCESSING.",
        "The worker checks the file is a real image, removes location data and creates three WebP sizes. Status becomes READY (or FAILED if the file is not a valid image). Reload the images to show them.",
        f"Order photos with {c('PUT .../images/order')}; the first photo becomes the main photo.",
    ]
)
story += h3("Enquiries and CRM")
story += bullets(
    [
        f"Enquiries: {c('GET /dealer/enquiries')}, reply with {c('POST /dealer/enquiries/{id}/respond')}. The first reply moves the lead from NEW to CONTACTED and records the response time.",
        f"Leads: {c('GET /dealer/leads')} (filters: stage, assignedTo=me|unassigned|memberId, followUpDue=true...). Members without LEADS_VIEW_ALL only see leads assigned to them.",
        f"Stages: {c('POST /dealer/leads/{id}/stage')}. Leads move forward only; OFFER_SENT may go back to NEGOTIATION; WON needs QUALIFIED first; LOST needs a lostReason; only managers can reopen closed leads.",
        f"Contact history: {c('POST /dealer/leads/{id}/activities')} (call, email, WhatsApp, meeting, note) with an optional next follow-up date.",
        f"Pipeline numbers: {c('GET /dealer/leads/stats')}; overall dashboard: {c('GET /dealer/dashboard')}.",
    ]
)
story.append(code_json(sample("leads")["response"], "GET /dealer/leads (one lead shown)", max_lines=50))
story += h3("Bidding on customer cars")
story += bullets(
    [
        f"{c('GET /dealer/bidding/sessions')} lists cars open for offers that this dealership may bid on (approved dealership, bidding enabled, invited or in an eligible province). Customer contact details, registration and VIN are hidden until an offer is accepted.",
        f"Bid with {c('POST /dealer/bidding/sessions/{id}/offers')} (amount, terms, private dealerNotes). Each dealership has one offer per session; posting again revises it (status UPDATED) when the session allows changes. The full history is kept.",
        "Every offer has an expiry time set by the session. Expired offers can be renewed while bidding is open by posting again.",
        f"Answer a customer counter-offer with {c('POST /dealer/offers/{id}/counter-response')} (accept=true sets your offer to the counter amount).",
        "When the customer accepts, the dealer gets a notification and a new lead with source OFFER_ACCEPTED.",
    ]
)

story += h2("6.10 Admin panel")
story.append(
    table(
        [
            ["Task", "Endpoints"],
            ["Approve dealers", f"{c('GET /admin/dealers?status=PENDING')}, {c('GET /admin/dealers/{id}')} (documents have download links), {c('PATCH /admin/dealers/{id}/status')}"],
            ["Review listings", f"{c('GET /admin/vehicles/review-queue')}, {c('POST /admin/vehicles/{id}/approve')}, {c('.../reject')}"],
            ["Moderate listings", f"{c('.../suspend')}, {c('.../unsuspend')}, {c('.../archive')}, {c('.../relist')}, feature or mark special with {c('PATCH .../flags')}"],
            ["Catalogue", f"{c('/admin/catalogue/*')}: makes, models, generations, variants with specifications, categories, features and feature assignments"],
            ["Enquiries", f"{c('GET /admin/enquiries?platformOnly=true')}, reply, assign a team member, or route to a dealer (creates a lead)"],
            ["Sell requests and bidding", f"Manual valuation {c('POST /admin/sell-requests/{id}/valuations')}; open bidding {c('POST /admin/sell-requests/{id}/bidding-sessions')}; reopen or cancel sessions"],
            ["Content", f"Articles, media, FAQs, pages, promotions under {c('/admin/...')}; publish with {c('POST .../{id}/status')}"],
            ["Users", f"{c('GET /admin/users')}, suspend with {c('PATCH /admin/users/{id}/status')}; super admins create admins and change roles"],
            ["Monitoring", f"{c('GET /admin/stats')}, {c('GET /admin/audit-logs')}, {c('GET /admin/system/outbox')} (background queue health) and retry failed events"],
        ],
        [0.22, 0.78],
        bold_first=True,
    )
)
story.append(p("Bidding rules are set per session when it is opened: closesAt (required), opensAt, allowBidModification, allowBidWithdrawal, allowCounterOffers, offerValidityHours (default 48), reservePrice, eligibleProvinces and inviteDealerIds. A vehicle can only have one live bidding session. A closed session accepts no new bids unless it is explicitly reopened."))

story += h2("6.11 Content and SEO")
story.append(p(f"Articles and static pages store their text as a list of <b>blocks</b>, never raw HTML. This keeps the apps safe from script injection. Render each block with native components:"))
story.append(
    table(
        [
            ["Block", "Fields", "Render as"],
            [c("paragraph"), "text", "Normal text"],
            [c("heading"), "text, level (2, 3 or 4)", "Heading"],
            [c("image"), "src (https), alt", "Image with alt text"],
            [c("link"), "text, href (https or /relative)", "Link or button"],
            [c("list"), "items (array of text)", "Bullet list"],
            [c("quote"), "text", "Quote"],
            [c("video"), "url (https)", "Embedded video"],
        ],
        [0.2, 0.4, 0.4],
    )
)
story += bullets(
    [
        f"Articles: {c('GET /content/articles')} (filters q, category, type, tag), {c('GET /content/articles/{slug}')}.",
        f"Videos and podcasts: {c('GET /content/media?type=VIDEO')}. FAQs: {c('GET /content/faqs?category=selling')}.",
        f"Static pages by slug: {c('privacy-policy')}, {c('terms-and-conditions')}, {c('insurance')}, {c('electric-vehicles')}, {c('ev-charging')} via {c('GET /content/pages/{slug}')}.",
        f"Promotions: {c('GET /promotions')} and {c('GET /promotions/{slug}')} with their vehicles.",
        f"Sitemaps for search engines: {c('GET /seo/sitemap.xml')} (index). Each article and page has metaTitle and metaDescription for SEO tags.",
    ]
)

# 7. Reference values
story += h1("7. Status and value reference")
story.append(p("These are the fixed values (enums) used in requests and responses. Use the value on the left in API calls and show your own label in the app."))
for title, rows in STATUS_TABLES:
    story.append(KeepTogether([Paragraph(esc(title), S["h3"]), table([["Value", "Meaning"]] + [[c(v), esc(m)] for v, m in rows], [0.34, 0.66])]))

# 8. API reference
story += h1("8. API reference")
story.append(p("This chapter lists every endpoint, generated from the running backend so it matches the code exactly. Paths are shown in full. In a path, <b>{id}</b> means you replace it with a value."))
story.append(
    table(
        [
            ["Label", "Meaning"],
            ["Public (no login)", "No token needed."],
            ["Public. Login optional", "Works without a token; with a token the request is linked to the user."],
            ["Signed-in user (any role)", "Send a valid access token."],
            ["Dealer member, permission X", "The user must be an active member of a dealership with permission X (see 5.6)."],
            ["Admin / Super admin only", "The user must have the ADMIN or SUPER_ADMIN role."],
            ["Success", "HTTP status code on success. 204 means no response body."],
        ],
        [0.3, 0.7],
        bold_first=True,
    )
)
story.append(Spacer(1, 4))
story.append(p("Request body tables list every field. Nested fields are written with dots, for example owner.email, and list items with [], for example items[].channel. Response bodies follow the shapes shown in chapters 4 to 6 and appendix B. Swagger UI (/docs) lets you try any endpoint."))

ops_by_tag = {}
for path, ops in spec["paths"].items():
    for method, operation in ops.items():
        for tag in operation.get("tags", ["Other"]):
            ops_by_tag.setdefault(tag, []).append((method.upper(), path, operation))

section = 1
for group_title, group_intro, tags in TAG_GROUPS:
    story += h2(f"8.{section} {group_title}")
    story.append(p(group_intro))
    for tag in tags:
        entries = sorted(ops_by_tag.get(tag, []), key=lambda item: (item[1], method_order(item[0])))
        if not entries:
            continue
        story.append(CondPageBreak(50 * mm))
        noun = "endpoint" if len(entries) == 1 else "endpoints"
        story.append(Heading(esc(f"{tag}  ·  {len(entries)} {noun}"), 2, S["h3"]))
        if TAG_INTRO.get(tag):
            story.append(p(esc(TAG_INTRO[tag]), "smallMuted"))
            story.append(Spacer(1, 4))
        for method, path, operation in entries:
            story += endpoint_block(method, path, operation)
    section += 1

# 9. Limits / next steps
story += h1("9. Current limits and open points")
story.append(p("These items are known and planned. App developers should design with them in mind."))
story.append(
    table(
        [
            ["Topic", "Current state", "Impact on apps"],
            ["Push notifications", "Not built. In-app list, email and SMS (provider to be chosen) only.", "Poll the unread count. A device-token endpoint will be added for FCM/APNs."],
            ["Real-time updates", "No WebSockets. Data is fetched on request.", "Refresh offer lists on screen open and pull-to-refresh."],
            ["SMS gateway", "Interface ready, logs messages only.", "None until a provider is chosen."],
            ["Email verification", "Not required at sign-up.", "None for now."],
            ["Payments", "Not in scope. Deals are completed offline by the dealer.", "No payment screens."],
            ["View counts with CDN caching", "Views are counted when the request reaches the server, not on CDN hits.", "View numbers are approximate."],
            ["Capacity target", "The '2 million concurrent users per second' target must be turned into measured targets and load-tested.", "None for app code."],
            ["Not yet tested on real services", "Photo upload to S3/MinIO, image processing, SMTP email and Redis were not run in the test environment.", "Test photo uploads on staging first."],
        ],
        [0.2, 0.42, 0.38],
        bold_first=True,
    )
)
story += h2("9.1 Business decisions waiting for confirmation")
story += bullets(
    [
        "Can a published vehicle be sold directly without being reserved first? (Currently yes.)",
        "Should reserved vehicles accept new enquiries? (Currently yes, as backup buyers.)",
        "Default bidding rules: offer validity, changes, withdrawals and counter-offers. (Currently configurable per session; default 48 h, all allowed.)",
        "Affordability rule: instalment up to 30% of gross income. (Confirm with the finance partner.)",
        "Automatic valuation: market median, mileage and condition adjustments, 15% trade margin. (Confirm the formula.)",
    ]
)

# Appendix A errors
story += h1("Appendix A. Error codes")
story.append(p(f"Not-found errors use the code <b>&lt;THING&gt;_NOT_FOUND</b> with status 404, for example {c('VEHICLE_NOT_FOUND')}, {c('DEALER_NOT_FOUND')}, {c('OFFER_NOT_FOUND')}, {c('SELL_REQUEST_NOT_FOUND')}, {c('LEAD_NOT_FOUND')}. The other codes are:"))
ERROR_MEANING = {
    "BELOW_RESERVE": "The offer is lower than the reserve price of this bidding session.",
    "FILE_TOO_LARGE": "The file is too big (vehicle and sell photos 15 MB, dealer documents 20 MB).",
    "REASON_REQUIRED": "This action needs a reason: rejecting a listing or dealer, an admin suspension, or marking a lead as lost.",
    "INVALID_CONTENT_BLOCK": "A content block has an unknown type or invalid fields (details say which block).",
    "UNKNOWN_NOTIFICATION_TYPE": "The notification preferences contain an unknown notification type.",
    "WINDOW_TOO_LONG": "The bidding window is longer than allowed (default maximum 168 hours).",
    "CANNOT_GRANT": "You tried to give a staff member a permission you do not have yourself.",
    "DEALER_INACTIVE": "The dealership is suspended or rejected, so this action is blocked.",
    "MISSING_DEALER_PERMISSION": "Your dealership role does not include the permission this action needs.",
    "CANNOT_CANCEL": "The bidding session is already awarded or cancelled.",
    "CANNOT_REOPEN": "Only closed sessions without an accepted offer can be reopened.",
    "CONCURRENT_UPDATE": "Someone changed the record at the same moment. Reload and try again.",
    "INVALID_STATE": "The sell request is in a status that does not allow this action.",
    "INVALID_STATUS_TRANSITION": "This status change is not allowed from the current status (details.allowed lists the allowed ones). Used for vehicles and dealers.",
    "INVALID_STAGE_TRANSITION": "This lead stage change is not allowed.",
    "LIMIT_REACHED": "The user already has the maximum number of saved searches (25).",
    "MATERIAL_CHANGE_REQUIRES_REVIEW": "These fields can only change in DRAFT. Move the vehicle back to draft (it will need a new review).",
    "MODIFICATION_NOT_ALLOWED": "This bidding session does not allow changing bids.",
    "NOT_ELIGIBLE": "This sell request cannot go to bidding in its current status, or the dealership may not bid on this session.",
    "OFFER_FINAL": "Your offer is already accepted or superseded and cannot change.",
    "OFFER_NOT_ACTIVE": "The offer is no longer active.",
    "STALE_VERSION": "The record changed since you loaded it (expectedVersion does not match). Reload and try again.",
    "TOO_MANY_IMAGES": "The maximum number of photos is reached (40 per vehicle, 20 per sell request).",
    "VEHICLE_LOCKED": "Photos cannot change while the vehicle is pending review, sold or archived.",
    "VEHICLE_NOT_EDITABLE": "Vehicles that are pending review, sold or archived cannot be edited.",
    "INVALID_STORAGE_KEY": "The upload key does not belong to this dealership or request.",
    "SELF_MANAGEMENT": "Admins cannot change their own status or role.",
}
error_rows = [["Code", "HTTP", "Meaning"]]
for code_name, info in sorted(errors.items(), key=lambda item: (item[1]["status"], item[0])):
    message = ERROR_MEANING.get(code_name) or re.sub(r"\$\{[^}]*\}", "...", info["message"] or "")
    message = re.sub(r"\s*\((?:BR|FR|NFR)-[^)]*\)", "", message)
    error_rows.append([c(code_name), str(info["status"]), esc(message)])
for code_name, status, meaning in [
    ("INVALID_STAGE_TRANSITION", 409, ERROR_MEANING["INVALID_STAGE_TRANSITION"]),
    ("NOT_FOUND / <THING>_NOT_FOUND", 404, "The record does not exist, or you are not allowed to see it."),
]:
    if code_name not in errors:
        error_rows.append([c(code_name), str(status), esc(meaning)])
story.append(table(error_rows, [0.36, 0.08, 0.56]))

# Appendix B samples
story += h1("Appendix B. More real responses")
story.append(p("These responses were captured from the running backend with demo data. Long values are shortened."))
for name, title in [("refresh", "POST /auth/refresh"), ("errorNotFound", "GET /vehicles/does-not-exist (404)"), ("errorTransition", "POST /dealer/vehicles/{id}/publish on a published vehicle (409)")]:
    s = sample(name)
    story.append(code_json(s["response"], f"{title}  ->  HTTP {s['status']}"))
    story.append(Spacer(1, 5))

# Appendix C requirement coverage
story += h1("Appendix C. Requirement coverage")
story.append(p("Where each requirement from the ChangeCars specification is implemented."))
coverage = [
    ("FR-01", "Registration and authentication", "Auth, Customers"),
    ("FR-02 to FR-07", "Search, listings, details, filters and sorting, new and used search", "Vehicles, Search, Catalogue"),
    ("FR-08, FR-09", "Sell your vehicle, valuation", "Selling"),
    ("FR-10, FR-52 to FR-56", "Dealer bidding, rules, offers, acceptance, expiry, counter-offers", "Bidding"),
    ("FR-11 to FR-13", "Dealer registration, vehicle management, dashboard", "Dealers, Vehicles, Dealer dashboard"),
    ("FR-14 to FR-16, FR-20 to FR-22", "Contact dealer, quote, Beat My Quote, trade-in, concierge, help me find", "Enquiries"),
    ("FR-17", "Vehicle comparison", "Vehicles, Catalogue"),
    ("FR-18, FR-19", "Finance and affordability calculators", "Finance"),
    ("FR-23, FR-24", "Specials and promotions, hot sellers", "Search, Content"),
    ("FR-25 to FR-27", "Categories, make/model/variant catalogue, location search", "Catalogue, Search"),
    ("FR-28 to FR-31, FR-35", "Articles, media, insurance and EV information, content management", "Content"),
    ("FR-32", "Newsletter", "Newsletter"),
    ("FR-33, FR-42", "Enquiry management, customer enquiry tracking", "Enquiries"),
    ("FR-34", "Administrator dashboard", "Admin and admin endpoints in every module"),
    ("FR-36, FR-48, FR-57", "Notifications and preferences", "Notifications plus event handlers"),
    ("FR-37 to FR-41", "Favourites, saved searches, alerts, customer dashboard, recently viewed", "Customers, Search"),
    ("FR-43 to FR-46", "Dealer CRM, lead stages, staff, branches", "CRM, Dealers"),
    ("FR-47, FR-49 to FR-51", "Vehicle lifecycle, data structure, features, availability", "Vehicles, Catalogue"),
    ("NFR-04, NFR-05, BR-14", "Security and role-based access", "Auth guards, dealer permission guard"),
    ("NFR-12", "SEO", "SEO, slugs, meta fields"),
    ("NFR-15, BR-13", "Logging, monitoring, audit trail", "Audit log, structured logs, admin system endpoints"),
    ("NFR-17", "Privacy", "Consent fields, data export, account deletion"),
]
story.append(table([["Requirement", "Topic", "Module"]] + [[esc(a), esc(b), esc(cc)] for a, b, cc in coverage], [0.24, 0.5, 0.26], bold_first=True))

# ───────────────────────── build ─────────────────────────
doc = GuideDoc(str(OUT))
doc.multiBuild(story)
print("written", OUT)
