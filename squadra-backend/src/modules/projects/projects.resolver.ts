import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './models/project.model';
import { Section } from './models/section.model';
import { UserModel } from '../auth/models/user.model';
import { Portfolio } from './models/portfolio.model';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import {
  CreateSectionInput,
  MoveSectionInput,
} from './dto/section.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Resolver(() => Project)
@UseGuards(GqlAuthGuard)
export class ProjectsResolver {
  constructor(private readonly projects: ProjectsService) {}

  @Query(() => [Project], { name: 'projects' })
  projectsByWorkspace(
    @Args('workspaceId', { type: () => ID }) workspaceId: string,
    @Args('includeArchived', { nullable: true }) includeArchived?: boolean,
  ) {
    return this.projects.listByWorkspace(workspaceId, includeArchived ?? false);
  }

  @Query(() => Project, { name: 'project' })
  project(@Args('id', { type: () => ID }) id: string) {
    return this.projects.findOne(id);
  }

  /** Proyectos del usuario autenticado (para el landing tras login). */
  @Query(() => [Project], { name: 'myProjects' })
  myProjects(@CurrentUser() user: AuthUser) {
    return this.projects.myProjects(user.userId);
  }

  /** Crea un proyecto en el workspace del usuario autenticado. */
  @Mutation(() => Project)
  createProjectForMe(
    @Args('name') name: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.createForUser(user.userId, name);
  }

  @Query(() => [Portfolio], { name: 'myPortfolios' })
  myPortfolios(@CurrentUser() user: AuthUser) {
    return this.projects.myPortfolios(user.userId);
  }

  @Mutation(() => Portfolio)
  createPortfolioForMe(
    @Args('name') name: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.createPortfolioForUser(user.userId, name);
  }

  @Mutation(() => Project)
  setProjectPortfolio(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('portfolioId', { type: () => ID, nullable: true })
    portfolioId: string | null,
  ) {
    return this.projects.setProjectPortfolio(projectId, portfolioId ?? null);
  }

  @Query(() => [UserModel], { name: 'projectMembers' })
  projectMembers(@Args('projectId', { type: () => ID }) projectId: string) {
    return this.projects.members(projectId);
  }

  @Query(() => [Section], { name: 'sections' })
  sections(@Args('projectId', { type: () => ID }) projectId: string) {
    return this.projects.listSections(projectId);
  }

  @Mutation(() => Project)
  createProject(@Args('input') input: CreateProjectInput) {
    return this.projects.create(input);
  }

  @Mutation(() => Project)
  updateProject(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProjectInput,
  ) {
    return this.projects.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteProject(@Args('id', { type: () => ID }) id: string) {
    return this.projects.softDelete(id);
  }

  @Mutation(() => Section)
  createSection(@Args('input') input: CreateSectionInput) {
    return this.projects.createSection(input);
  }

  @Mutation(() => Section)
  moveSection(@Args('input') input: MoveSectionInput) {
    return this.projects.moveSection(input);
  }

  @Mutation(() => Boolean)
  deleteSection(@Args('id', { type: () => ID }) id: string) {
    return this.projects.deleteSection(id);
  }
}
