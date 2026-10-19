import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { mergeMap } from 'rxjs/operators';
import { DealerTradeIdentityService } from '../../infrastructure/dealertrade/dealertrade-identity.service';

@Injectable()
export class DealerTradeIdentityInterceptor implements NestInterceptor {
  constructor(private readonly identities: DealerTradeIdentityService) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const path: string = context.switchToHttp().getRequest().originalUrl ?? '';
    const publicData = /\/(vehicles|dealers|customers|me|enquiries|promotions)(\/|\?|$)|\/web\/(cars|forms)(\/|\?|$)/.test(path) && !/\/(admin|dealer|dashboard)\//.test(path);
    if (!publicData) return next.handle();
    return next.handle().pipe(mergeMap(async value => {
      await this.identities.refresh();
      return this.identities.present(value);
    }));
  }
}
