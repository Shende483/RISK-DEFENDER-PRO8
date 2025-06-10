import { IsString, IsOptional, Matches, IsInt, Min, Max, IsDateString, IsEnum, IsMongoId, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProxyDto {
  @ApiProperty({
    description: 'IPv4 address of the proxy (e.g., "192.168.1.1")',
    example: '192.168.1.1',
    required: true,
  })
  @IsString()
  @Matches(/^(?:\d{1,3}\.){3}\d{1,3}$/, { message: 'Invalid IPv4 address' })
  ip4: string;

  @ApiProperty({
    description: 'IPv6 address of the proxy (e.g., "2001:db8::1")',
    example: '2001:db8::1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$/, { message: 'Invalid IPv6 address' })
  ip6?: string;

  @ApiProperty({
    description: 'HTTP port for IPv4 (e.g., 8080)',
    example: 8080,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip4HttpPort?: number;

  @ApiProperty({
    description: 'HTTPS port for IPv4 (e.g., 8443)',
    example: 8443,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip4HttpsPort?: number;

  @ApiProperty({
    description: 'SOCKS port for IPv4 (e.g., 1080)',
    example: 1080,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip4SocksPort?: number;

  @ApiProperty({
    description: 'HTTP port for IPv6 (e.g., 8081)',
    example: 8081,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip6HttpPort?: number;

  @ApiProperty({
    description: 'HTTPS port for IPv6 (e.g., 8444)',
    example: 8444,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip6HttpsPort?: number;

  @ApiProperty({
    description: 'SOCKS port for IPv6 (e.g., 1081)',
    example: 1081,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip6SocksPort?: number;

  @ApiProperty({
    description: 'List of broker IDs associated with this proxy',
    example: ['507f1f77bcf86cd799439012'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  brokerList?: string[];

  @ApiProperty({
    description: 'Username for proxy authentication',
    example: 'proxyUser',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipUserName?: string;

  @ApiProperty({
    description: 'Password for proxy authentication',
    example: 'proxyPass',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipPassword?: string;

  @ApiProperty({
    description: 'Proxy provider name (e.g., "ProxyProviderInc")',
    example: 'ProxyProviderInc',
    required: true,
  })
  @IsString()
  ipProvider: string;

  @ApiProperty({
    description: 'Start date of the proxy service',
    example: '2025-01-01T00:00:00.000Z',
    required: true,
  })
  @IsDateString()
  ipStart: string;

  @ApiProperty({
    description: 'Expiry date of the proxy service',
    example: '2025-12-31T23:59:59.999Z',
    required: true,
  })
  @IsDateString()
  ipExpiry: string;

  @ApiProperty({
    description: 'Status of the proxy service',
    enum: ['ACTIVE', 'EXPIRED'],
    example: 'ACTIVE',
    required: true,
  })
  @IsEnum(['ACTIVE', 'EXPIRED'])
  status: 'ACTIVE' | 'EXPIRED';
}

export class UpdateProxyDto {
  @ApiProperty({
    description: 'IPv4 address of the proxy (e.g., "192.168.1.1")',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\d{1,3}\.){3}\d{1,3}$/, { message: 'Invalid IPv4 address' })
  ip4?: string;

  @ApiProperty({
    description: 'IPv6 address of the proxy (e.g., "2001:db8::1")',
    example: '2001:db8::1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$/, { message: 'Invalid IPv6 address' })
  ip6?: string;

  @ApiProperty({
    description: 'HTTP port for IPv4 (e.g., 8080)',
    example: 8080,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip4HttpPort?: number;

  @ApiProperty({
    description: 'HTTPS port for IPv4 (e.g., 8443)',
    example: 8443,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip4HttpsPort?: number;

  @ApiProperty({
    description: 'SOCKS port for IPv4 (e.g., 1080)',
    example: 1080,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip4SocksPort?: number;

  @ApiProperty({
    description: 'HTTP port for IPv6 (e.g., 8081)',
    example: 8081,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip6HttpPort?: number;

  @ApiProperty({
    description: 'HTTPS port for IPv6',
    example: 8444,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip6HttpsPort?: number;

  @ApiProperty({
    description: 'SOCKS port for IPv6',
    example: 1081,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ip6SocksPort?: number;

  @ApiProperty({
    description: 'List of broker IDs associated with this proxy',
    example: ['507f1f77bcf86cd799439012'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  brokerList?: string[];

  @ApiProperty({
    description: 'Username for proxy authentication',
    example: 'proxyUser',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipUserName?: string;

  @ApiProperty({
    description: 'Password for proxy authentication',
    example: 'proxyPass',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipPassword?: string;

  @ApiProperty({
    description: 'Proxy provider name (e.g., "ProxyProviderInc")',
    example: 'ProxyProviderInc',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipProvider?: string;

  @ApiProperty({
    description: 'Start date of the proxy service',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  ipStart?: string;

  @ApiProperty({
    description: 'Expiry date of the proxy service',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  ipExpiry?: string;

  @ApiProperty({
    description: 'Status of the proxy service',
    enum: ['ACTIVE', 'EXPIRED'],
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'EXPIRED'])
  status?: 'ACTIVE' | 'EXPIRED';
}