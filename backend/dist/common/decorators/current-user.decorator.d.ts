export declare const CurrentUser: (...dataOrPipes: (string | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
export interface JwtPayload {
    sub: number;
    username: string;
    role: string;
    isProfileComplete?: boolean;
    iat?: number;
    exp?: number;
}
