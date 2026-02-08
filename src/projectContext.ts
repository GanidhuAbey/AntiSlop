// Store and manage project requirements context
export let projectContext: string = '';

export function getProjectContext(): string {
    return projectContext;
}

export function setProjectContext(context: string): void {
    projectContext = context;
}

export function hasProjectContext(): boolean {
    return projectContext.length > 0;
}
