import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client'; // ✅ importa el enum de Prisma

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(data: { name: string; email: string; password: string; role?: Role }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('El correo ya está registrado.');

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        // 👇 usa el enum, no string literal
        role: data.role || Role.CUSTOMER,
      },
    });

    return { message: 'Usuario registrado', user };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta.');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwt.signAsync(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken);
      const newAccess = await this.jwt.signAsync(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          name: payload.name,
        },
        { expiresIn: '15m' },
      );
      return { accessToken: newAccess };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}
