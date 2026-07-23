import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload } from './models/auth-payload.model';
import { UserModel } from './models/user.model';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args('input') input: RegisterInput) {
    return this.auth.register(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput) {
    return this.auth.login(input);
  }

  @Mutation(() => AuthPayload)
  refresh(@Args('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }

  @Mutation(() => Boolean)
  logout(@Args('refreshToken') refreshToken: string) {
    return this.auth.logout(refreshToken);
  }

  /** Endpoint protegido de ejemplo: devuelve el usuario del token. */
  @Query(() => UserModel, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { id: user.userId, email: user.email, fullName: '', avatarUrl: null };
  }
}
