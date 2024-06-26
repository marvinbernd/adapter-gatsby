/**
 * Banner text added to files that should not be edited by users.
 */
export const NON_EDITABLE_FILE_BANNER =
	"// Code generated by Slice Machine. DO NOT EDIT.";

/**
 * The default file path at which environment variables will be stored.
 */
export const DEFAULT_ENVIRONMENT_VARIABLE_FILE_PATH = ".env.local";

/**
 * The file paths at which environment variables will be read in order from
 * lowest priority to highest priority.
 */
export const ENVIRONMENT_VARIABLE_PATHS = [
	".env",
	".env.development",
	".env.local",
	".env.development.local",
];

/**
 * The name of the environment variable that stores the active Prismic
 * environment.
 */
export const PRISMIC_ENVIRONMENT_ENVIRONMENT_VARIABLE_NAME =
	"GATSBY_PUBLIC_PRISMIC_ENVIRONMENT";
