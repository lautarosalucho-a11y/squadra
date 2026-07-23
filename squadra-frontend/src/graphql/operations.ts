/** Operaciones GraphQL contra el backend Squadra (NestJS).
 *  Contratos derivados de los resolvers: auth, projects, tasks. */

export const LOGIN = /* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user { id email fullName }
    }
  }
`;

export const REGISTER = /* GraphQL */ `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user { id email fullName }
    }
  }
`;

/** Tablero (Kanban): tareas agrupadas por sección. */
export const PROJECT_BOARD = /* GraphQL */ `
  query ProjectBoard($projectId: ID!) {
    projectTasks(projectId: $projectId, groupBy: SECTION) {
      groups {
        key
        label
        tasks {
          id
          title
          status
          sectionId
          assigneeId
          dueDate
          position
          version
        }
      }
    }
  }
`;

/** Vista Lista: tareas agrupadas (SECTION por defecto, o ASSIGNEE). */
export const PROJECT_LIST = /* GraphQL */ `
  query ProjectList($projectId: ID!, $groupBy: GroupBy) {
    projectTasks(projectId: $projectId, groupBy: $groupBy) {
      groups {
        key
        label
        tasks {
          id
          title
          status
          sectionId
          assigneeId
          startDate
          dueDate
          description
          position
          version
          subtasks {
            id
            title
            status
            sectionId
            assigneeId
            dueDate
            description
            position
            version
          }
        }
      }
    }
  }
`;

/** Edición inline de una tarea. El backend soporta title, status y assigneeId,
 *  con expectedVersion para bloqueo optimista (rechaza en conflicto). */
export const UPDATE_TASK = /* GraphQL */ `
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      title
      status
      assigneeId
      startDate
      dueDate
      version
    }
  }
`;

/** Vista Calendario: tareas planas del proyecto con fechas. */
export const PROJECT_CALENDAR = /* GraphQL */ `
  query ProjectCalendar($projectId: ID!) {
    projectTasks(projectId: $projectId, groupBy: NONE) {
      groups {
        tasks {
          id
          title
          status
          sectionId
          assigneeId
          startDate
          dueDate
          position
          version
        }
      }
    }
  }
`;

/** Vista Cronograma (Gantt): tareas por sección con fechas. */
export const PROJECT_GANTT = /* GraphQL */ `
  query ProjectGantt($projectId: ID!) {
    projectTasks(projectId: $projectId, groupBy: SECTION) {
      groups {
        key
        label
        tasks {
          id
          title
          status
          startDate
          dueDate
          version
        }
      }
    }
  }
`;

/** Aristas de dependencia del proyecto (blocker → blocked). */
export const PROJECT_DEPENDENCIES = /* GraphQL */ `
  query ProjectDependencies($projectId: ID!) {
    projectDependencies(projectId: $projectId) {
      blockerTaskId
      blockedTaskId
    }
  }
`;

export const ADD_DEPENDENCY = /* GraphQL */ `
  mutation AddDependency($blockerId: ID!, $blockedId: ID!) {
    addDependency(blockerId: $blockerId, blockedId: $blockedId) {
      id
    }
  }
`;

/** Mueve una tarea entre secciones / reordena (drag Kanban). */
export const MOVE_TASK = /* GraphQL */ `
  mutation MoveTask($input: MoveTaskInput!) {
    moveTask(input: $input) {
      id
      sectionId
      position
      version
    }
  }
`;

/** Hilo de comentarios de una tarea. */
export const TASK_COMMENTS = /* GraphQL */ `
  query TaskComments($taskId: ID!) {
    taskComments(taskId: $taskId) {
      id
      authorId
      body
      mentions
      createdAt
    }
  }
`;

export const ADD_COMMENT = /* GraphQL */ `
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) {
      id
      authorId
      body
      mentions
      createdAt
    }
  }
`;

/** Proyectos del usuario autenticado (landing tras login + sidebar). */
export const MY_PROJECTS = /* GraphQL */ `
  query MyProjects {
    myProjects {
      id
      name
      defaultView
      portfolioId
      updatedAt
    }
  }
`;

export const CREATE_PROJECT_FOR_ME = /* GraphQL */ `
  mutation CreateProjectForMe($name: String!) {
    createProjectForMe(name: $name) {
      id
      name
      defaultView
    }
  }
`;

/** Objetivos (Estrategia) del usuario. */
export const MY_GOALS = /* GraphQL */ `
  query MyGoals {
    myGoals {
      id
      title
      description
      ownerId
      status
      progress
      dueDate
      version
    }
  }
`;

export const CREATE_GOAL = /* GraphQL */ `
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) { id }
  }
`;

export const UPDATE_GOAL = /* GraphQL */ `
  mutation UpdateGoal($id: ID!, $input: UpdateGoalInput!) {
    updateGoal(id: $id, input: $input) {
      id
      status
      progress
      version
    }
  }
`;

export const DELETE_GOAL = /* GraphQL */ `
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`;

/** Portafolios del usuario. */
export const MY_PORTFOLIOS = /* GraphQL */ `
  query MyPortfolios {
    myPortfolios {
      id
      name
      updatedAt
    }
  }
`;

export const CREATE_PORTFOLIO_FOR_ME = /* GraphQL */ `
  mutation CreatePortfolioForMe($name: String!) {
    createPortfolioForMe(name: $name) {
      id
      name
    }
  }
`;

export const SET_PROJECT_PORTFOLIO = /* GraphQL */ `
  mutation SetProjectPortfolio($projectId: ID!, $portfolioId: ID) {
    setProjectPortfolio(projectId: $projectId, portfolioId: $portfolioId) {
      id
      portfolioId
    }
  }
`;

/** Home "Mis tareas": tareas asignadas al usuario en todos sus proyectos. */
export const MY_TASKS = /* GraphQL */ `
  query MyTasks {
    myTasks {
      id
      title
      status
      projectId
      dueDate
      version
    }
  }
`;

/** Definiciones de campos personalizados del proyecto (columnas de la planilla). */
export const PROJECT_CUSTOM_FIELDS = /* GraphQL */ `
  query ProjectCustomFields($projectId: ID!) {
    projectCustomFields(projectId: $projectId) {
      id
      name
      type
      options
      position
    }
  }
`;

/** Todos los valores de campos personalizados de las tareas del proyecto. */
export const PROJECT_CF_VALUES = /* GraphQL */ `
  query ProjectCfValues($projectId: ID!) {
    projectCustomFieldValues(projectId: $projectId) {
      taskId
      customFieldId
      value
    }
  }
`;

export const SET_CF_VALUE = /* GraphQL */ `
  mutation SetCfValue($input: SetCustomFieldValueInput!) {
    setCustomFieldValue(input: $input) {
      taskId
      customFieldId
      value
    }
  }
`;

/** Miembros del equipo (workspace) del usuario. */
export const WORKSPACE_MEMBERS = /* GraphQL */ `
  query WorkspaceMembers {
    workspaceMembers {
      id
      fullName
      email
      avatarUrl
    }
  }
`;

/** Alta de un miembro por el dueño. */
export const INVITE_MEMBER = /* GraphQL */ `
  mutation InviteMember($email: String!, $fullName: String!, $password: String!) {
    inviteMember(email: $email, fullName: $fullName, password: $password) {
      id
      fullName
      email
    }
  }
`;

/** Miembros del proyecto (para autocompletar @menciones). */
export const PROJECT_MEMBERS = /* GraphQL */ `
  query ProjectMembers($projectId: ID!) {
    projectMembers(projectId: $projectId) {
      id
      fullName
      email
      avatarUrl
    }
  }
`;

/** Inbox del usuario autenticado (room `user:{id}` para push en vivo). */
export const INBOX = /* GraphQL */ `
  query Inbox($unreadOnly: Boolean) {
    inbox(unreadOnly: $unreadOnly) {
      id
      taskId
      type
      payload
      readAt
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_READ = /* GraphQL */ `
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = /* GraphQL */ `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const CREATE_TASK = /* GraphQL */ `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      status
      sectionId
      position
    }
  }
`;
