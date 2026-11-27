/**
 * Feature flags controlling optional multi-tenant cloud workspace UI entry points.
 * Public local-first deployments keep hosted cloud entry points hidden unless explicitly enabled.
 */
export const IS_CLOUD_WORKSPACE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_CLOUD_WORKSPACE === 'true';
