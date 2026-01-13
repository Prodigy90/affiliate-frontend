/**
 * Better Auth user type with affiliate-specific fields
 */
export type AppUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
  refId?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Better Auth session type
 */
export type AppSession = {
  user: AppUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

/**
 * Common props for dynamic route pages with an ID parameter.
 * In Next.js 15+, params is a Promise that must be awaited.
 */
export type PageProps<T extends string = "id"> = {
  params: Promise<{ [K in T]: string }>;
};
