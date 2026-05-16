import { ConfigService } from '@nestjs/config';
import { AlipaySdk } from 'alipay-sdk';
export declare class AlipayConfig {
    private readonly configService;
    private readonly logger;
    readonly sdk: AlipaySdk;
    readonly appId: string;
    readonly notifyUrl: string;
    readonly returnUrl: string;
    constructor(configService: ConfigService);
    isAvailable(): boolean;
}
