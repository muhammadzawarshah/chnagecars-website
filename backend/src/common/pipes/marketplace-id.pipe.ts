import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Matches, ValidationOptions } from 'class-validator';

export const MARKETPLACE_ID = /^(?:\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
export const IsMarketplaceId = (options?: ValidationOptions) => Matches(MARKETPLACE_ID, options);
@Injectable()
export class ParseMarketplaceIdPipe implements PipeTransform<string> {
  transform(value: string) {
    if (typeof value !== 'string' || !MARKETPLACE_ID.test(value)) throw new BadRequestException('Invalid vehicle/dealer ID');
    return value;
  }
}
