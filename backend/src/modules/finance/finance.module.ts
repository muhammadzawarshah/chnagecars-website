import { Body, Controller, HttpCode, HttpStatus, Module, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Public } from '../../common/decorators/auth.decorators';
import { Errors } from '../../common/errors/app-error';
import { calculateAffordability, calculateRepayment, DEFAULT_FINANCE } from './finance.calculator';

export class RepaymentDto {
  @ApiProperty({ example: 450000 }) @IsNumber() @Min(1) @Max(100_000_000) vehiclePrice: number;
  @ApiProperty({ example: 45000 }) @IsNumber() @Min(0) deposit: number;
  @ApiProperty({ example: 72, default: DEFAULT_FINANCE.termMonths }) @IsInt() @Min(6) @Max(96) termMonths: number;
  @ApiProperty({ example: 11.75 }) @IsNumber() @Min(0) @Max(40) annualInterestRate: number;
  @ApiPropertyOptional({ example: 30 }) @IsOptional() @IsNumber() @Min(0) @Max(50) balloonPercent?: number;
}

export class AffordabilityDto {
  @ApiProperty({ example: 45000 }) @IsNumber() @Min(0) @Max(10_000_000) monthlyIncome: number;
  @ApiProperty({ example: 25000 }) @IsNumber() @Min(0) @Max(10_000_000) monthlyExpenses: number;
  @ApiProperty({ example: 30000 }) @IsNumber() @Min(0) deposit: number;
  @ApiProperty({ example: 72 }) @IsInt() @Min(6) @Max(96) termMonths: number;
  @ApiProperty({ example: 11.75 }) @IsNumber() @Min(0) @Max(40) annualInterestRate: number;
  @ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber() @Min(0) @Max(50) balloonPercent?: number;
}

/** Public calculators (FR-18, FR-19). Stateless and cheap: safe to serve at very high volume. */
@ApiTags('Finance')
@Public()
@Controller('finance')
export class FinanceController {
  @Post('repayment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Monthly repayment, finance amount and total repayment (FR-18)' })
  repayment(@Body() dto: RepaymentDto) {
    if (dto.deposit > dto.vehiclePrice) throw Errors.badRequest('DEPOSIT_TOO_HIGH', 'Deposit cannot exceed the vehicle price');
    try {
      return calculateRepayment(dto);
    } catch (error) {
      throw Errors.badRequest('INVALID_FINANCE_INPUT', (error as Error).message);
    }
  }

  @Post('affordability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '"What can I afford" vehicle budget estimate (FR-19)' })
  affordability(@Body() dto: AffordabilityDto) {
    return calculateAffordability(dto);
  }
}

@Module({ controllers: [FinanceController] })
export class FinanceModule {}
