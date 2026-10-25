import { applyDecorators, CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { Public } from '../../common/decorators/auth.decorators';
import { Errors } from '../../common/errors/app-error';
import type { DealerInventoryContext } from '../dealers/dealer-access';
import { DealerAppTokensService } from './dealer-app-tokens.service';
import type { DealerAppScope } from './dealer-app.dto';

const APP_SCOPES_KEY = 'dealerApp:scopes';
export type DealerAppContext = DealerInventoryContext & { tokenId: string; appName: string; scopes: string[] };

/** Separate authentication boundary; these credentials never grant a user/admin identity. */
export const DealerAppAuth = () => applyDecorators(Public(), UseGuards(DealerAppGuard));
export const AppScopes = (...scopes: DealerAppScope[]) => SetMetadata(APP_SCOPES_KEY, scopes);
export const CurrentDealerApp = createParamDecorator((_data: unknown, context: ExecutionContext): DealerAppContext => {
  const app = context.switchToHttp().getRequest().dealerApp;
  if (!app) throw Errors.unauthorized();
  return app;
});

@Injectable()
export class DealerAppGuard implements CanActivate {
  constructor(private readonly tokens: DealerAppTokensService, private readonly reflector: Reflector, private readonly cls: ClsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const header: unknown = req.headers?.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) throw Errors.unauthorized();
    const principal = await this.tokens.authenticate(header.slice(7).trim());
    // Fail closed: every handler must explicitly declare its required scopes.
    const scopes = this.reflector.getAllAndOverride<DealerAppScope[] | undefined>(APP_SCOPES_KEY, [context.getHandler(), context.getClass()]);
    if (!scopes?.length || scopes.some(scope => !principal.scopes.includes(scope))) {
      throw Errors.forbidden('MISSING_APP_SCOPE', 'Token does not allow this operation');
    }
    req.dealerApp = { ...principal, userId: null, branchId: null, wideScope: true } satisfies DealerAppContext;
    if (this.cls.isActive()) this.cls.set('dealerAppTokenId', principal.tokenId);
    return true;
  }
}
