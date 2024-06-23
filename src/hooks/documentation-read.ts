import type { DocumentationReadHook } from "@slicemachine/plugin-kit";

import type { PluginOptions } from "../types";

export const documentationRead: DocumentationReadHook<
	PluginOptions
> = async () => {
	return [];
};
