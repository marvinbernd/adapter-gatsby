import { it, expect, TestContext } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
	CustomType,
	SharedSlice,
} from "@prismicio/types-internal/lib/customtypes";
import {
	createSliceMachinePluginRunner,
	SliceMachinePluginRunner,
} from "@slicemachine/plugin-kit";
import { generateTypes, GenerateTypesConfig } from "prismic-ts-codegen";
import prettier from "prettier";

import adapter from "../../src";

const resolveModel = <TModel extends CustomType | SharedSlice>(
	ctx: TestContext,
	model: TModel | ((ctx: TestContext) => TModel),
) => {
	return typeof model === "function" ? model(ctx) : model;
};

const resolveTypesConfigModels = (
	model: CustomType | SharedSlice,
): Pick<GenerateTypesConfig, "customTypeModels" | "sharedSliceModels"> => {
	if ("json" in model) {
		return {
			customTypeModels: [model],
		};
	} else {
		return {
			sharedSliceModels: [model],
		};
	}
};

type ExpectGlobalContentTypesArgs = {
	generateTypesConfig?: GenerateTypesConfig;
	format?: boolean;
};

export const expectGlobalContentTypes = async (
	ctx: TestContext,
	args: ExpectGlobalContentTypesArgs = {},
): Promise<void> => {
	const contents = await fs.readFile(
		path.join(ctx.project.root, "prismicio-types.d.ts"),
		"utf8",
	);

	let generatedTypes = generateTypes({
		...args.generateTypesConfig,
		clientIntegration: {
			includeCreateClientInterface: true,
			includeContentNamespace: true,
			...args.generateTypesConfig?.clientIntegration,
		},
	});
	generatedTypes = `// Code generated by Slice Machine. DO NOT EDIT.\n\n${generatedTypes}`;

	if (args.format ?? true) {
		expect(contents).toBe(
			await prettier.format(generatedTypes, { parser: "typescript" }),
		);
	} else {
		expect(contents).toBe(generatedTypes);
	}
};

type TestGlobalContentTypesArgs<TModel extends CustomType | SharedSlice> = {
	/**
	 * The Custom Type or Shared Slice model used throughout the test.
	 */
	model: TModel | ((ctx: TestContext) => TModel);

	/**
	 * A function that calls the test's Slice Machine plugin hook.
	 */
	hookCall: (context: {
		/**
		 * **Important**: Do not use `ctx.pluginRunner`. Use `pluginRunner` instead.
		 */
		ctx: TestContext;

		/**
		 * The resolved model provided to the test.
		 */
		model: TModel;

		/**
		 * **Important**: Use this plugin runner, not `ctx.pluginRunner`.
		 */
		pluginRunner: SliceMachinePluginRunner;
	}) => void | Promise<void>;

	generateTypesConfig?: Partial<GenerateTypesConfig>;
};

export const testGlobalContentTypes = <TModel extends CustomType | SharedSlice>(
	args: TestGlobalContentTypesArgs<TModel>,
): void => {
	it.concurrent(
		"global types file contains TypeScript types for the model",
		async (ctx) => {
			const model = resolveModel(ctx, args.model);

			await args.hookCall({
				ctx,
				model,
				pluginRunner: ctx.pluginRunner,
			});

			await expectGlobalContentTypes(ctx, {
				generateTypesConfig: {
					...resolveTypesConfigModels(model),
					...args.generateTypesConfig,
				},
			});
		},
	);

	it.concurrent(
		"global types file is not formatted if formatting is disabled",
		async (ctx) => {
			ctx.project.config.adapter.options.format = false;
			const pluginRunner = createSliceMachinePluginRunner({
				project: ctx.project,
				nativePlugins: {
					[ctx.project.config.adapter.resolve]: adapter,
				},
			});
			await pluginRunner.init();

			const model = resolveModel(ctx, args.model);

			await args.hookCall({
				ctx,
				model,
				pluginRunner,
			});

			await expectGlobalContentTypes(ctx, {
				generateTypesConfig: {
					...resolveTypesConfigModels(model),
					...args.generateTypesConfig,
				},
				format: false,
			});
		},
	);

	it.concurrent(
		"global types file uses @prismicio/types types provider if no types provider is detected",
		async (ctx) => {
			const model = resolveModel(ctx, args.model);

			await args.hookCall({
				ctx,
				model,
				pluginRunner: ctx.pluginRunner,
			});

			await expectGlobalContentTypes(ctx, {
				generateTypesConfig: {
					...resolveTypesConfigModels(model),
					...args.generateTypesConfig,
					typesProvider: "@prismicio/types",
				},
			});
		},
	);

	it.concurrent(
		"global types file uses @prismicio/client types provider if @prismicio/client@>=7 is detected",
		async (ctx) => {
			await fs.mkdir(
				path.join(ctx.project.root, "node_modules/@prismicio/client"),
				{ recursive: true },
			);
			await fs.writeFile(
				path.join(
					ctx.project.root,
					"node_modules/@prismicio/client/package.json",
				),
				JSON.stringify({
					name: "@prismicio/client",
					version: "7.0.0",
				}),
			);

			const model = resolveModel(ctx, args.model);

			await args.hookCall({
				ctx,
				model,
				pluginRunner: ctx.pluginRunner,
			});

			await expectGlobalContentTypes(ctx, {
				generateTypesConfig: {
					...resolveTypesConfigModels(model),
					...args.generateTypesConfig,
					typesProvider: "@prismicio/client",
				},
			});
		},
	);

	it.concurrent(
		"global types file uses @prismicio/types types provider if @prismicio/client@>=7 cannot be resolved and @prismicio/types can be resolved",
		async (ctx) => {
			await fs.mkdir(
				path.join(ctx.project.root, "node_modules/@prismicio/types"),
				{
					recursive: true,
				},
			);
			await fs.writeFile(
				path.join(
					ctx.project.root,
					"node_modules/@prismicio/types/package.json",
				),
				JSON.stringify({ name: "@prismicio/types" }),
			);

			const model = resolveModel(ctx, args.model);

			await args.hookCall({
				ctx,
				model,
				pluginRunner: ctx.pluginRunner,
			});

			await expectGlobalContentTypes(ctx, {
				generateTypesConfig: {
					...resolveTypesConfigModels(model),
					...args.generateTypesConfig,
					typesProvider: "@prismicio/types",
				},
			});
		},
	);
};