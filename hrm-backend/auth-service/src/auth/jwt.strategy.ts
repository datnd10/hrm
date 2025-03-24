import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SECRET, // Should be in environment variables
        });
    }

    async validate(payload: any) {
        const user = await this.authService.validateUser(payload.sub);
        if (!user) {
            throw new UnauthorizedException();
        }
        return { id: payload.sub, email: payload.email, roleId: payload.roleId, organization: payload.organization };
    }
}
