import * as path from "node:path";
import type {
	ProjectInitHook,
	ProjectInitHookData,
	SliceMachineContext,
} from "@slicemachine/plugin-kit";
import { writeProjectFile } from "@slicemachine/plugin-kit/fs";

import { rejectIfNecessary } from "../lib/rejectIfNecessary";

import type { PluginOptions } from "../types";

type InstallDependenciesArgs = {
	installDependencies: ProjectInitHookData["installDependencies"];
};

const installDependencies = async ({
	installDependencies,
}: InstallDependenciesArgs) => {
	await installDependencies({
		dependencies: {
			"@prismicio/client": "latest",
			"@prismicio/react": "latest",
		},
	});
};

type CreatePrismicIOFileArgs = SliceMachineContext<PluginOptions>;

const createPrismicIOFile = async ({
	helpers,
	options,
}: CreatePrismicIOFileArgs) => {
	const filename = path.join("src", `utils`, `prismicio.js`);
	const contents = `
		import * as prismic from "@prismicio/client";

		export const repositoryName = process.env.GATSBY_PRISMIC_REPOSITORY_NAME;

		export const routes = [
			// Define your routes here
		];

		export const createClient = (config = {}) => {
			return prismic.createClient(repositoryName, {
				routes,
				...config,
			});
		};
	`;

	await writeProjectFile({
		filename,
		contents,
		format: options.format,
		helpers,
	});
};

type CreateSliceSimulatorPageArgs = SliceMachineContext<PluginOptions>;

const createSliceSimulatorPage = async ({
	helpers,
	options,
}: CreateSliceSimulatorPageArgs) => {
	const filename = path.join("src", `pages`, `slice-simulator.js`);
	const contents = `
		import React from 'react';
		import { SliceSimulator } from "@slicemachine/adapter-gatsby/simulator";
		import { SliceZone } from "@prismicio/react";
		import { components } from "../slices";

		const SliceSimulatorPage = () => (
			<SliceSimulator sliceZone={(props) => <SliceZone {...props} components={components} />} />
		);

		export default SliceSimulatorPage;
	`;

	await writeProjectFile({
		filename,
		contents,
		format: options.format,
		helpers,
	});
};

const createPreviewRoute = async ({
	helpers,
	options,
}: SliceMachineContext<PluginOptions>) => {
	const filename = path.join("src", `utils`, `preview.js`);
	const contents = `
		import { createClient } from "./prismicio";

		export const previewHandler = async (req, res) => {
			const client = createClient();
			// Handle preview logic
		};
	`;

	await writeProjectFile({
		filename,
		contents,
		format: options.format,
		helpers,
	});
};

const createExitPreviewRoute = async ({
	helpers,
	options,
}: SliceMachineContext<PluginOptions>) => {
	const filename = path.join("src", `utils`, `exit-preview.js`);
	const contents = `
		export const exitPreviewHandler = (req, res) => {
			// Handle exit preview logic
		};
	`;

	await writeProjectFile({
		filename,
		contents,
		format: options.format,
		helpers,
	});
};

const modifySliceMachineConfig = async ({
	helpers,
	options,
}: SliceMachineContext<PluginOptions>) => {
	const project = await helpers.getProject();
	project.config.localSliceSimulatorURL =
		"http://localhost:8000/slice-simulator";

	if (
		project.config.libraries &&
		project.config.libraries.includes("./slices")
	) {
		project.config.libraries = ["./src/slices"];
	}

	await helpers.updateSliceMachineConfig(project.config, {
		format: options.format,
	});
};

export const projectInit: ProjectInitHook<PluginOptions> = async (
	{ installDependencies: _installDependencies },
	context,
) => {
	rejectIfNecessary(
		await Promise.allSettled([
			installDependencies({ installDependencies: _installDependencies }),
			modifySliceMachineConfig(context),
			createPrismicIOFile(context),
			createSliceSimulatorPage(context),
			createPreviewRoute(context),
			createExitPreviewRoute(context),
		]),
	);
};
