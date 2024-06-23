"use client";

import * as React from "react";

import {
	SliceSimulatorProps as BaseSliceSimulatorProps,
	SimulatorManager,
	StateEventType,
	getDefaultMessage,
	getDefaultSlices,
} from "@prismicio/simulator/kit";

const simulatorManager = new SimulatorManager();

export type SliceSimulatorProps = Omit<BaseSliceSimulatorProps, "state">;

/**
 * Simulate slices in isolation. The slice simulator enables live slice
 * development in Slice Machine and live previews in the Page Builder.
 */
export const SliceSimulator = ({
	background,
	zIndex,
	...restProps
}: SliceSimulatorProps): JSX.Element => {
	if (!("sliceZone" in restProps)) {
		throw new Error(
			"A sliceZone prop must be provided when <SliceZone> is rendered in a Client Component. Add a sliceZone prop or convert your simulator to a Server Component with the getSlices helper.",
		);
	}

	const [slices, setSlices] = React.useState(() => getDefaultSlices());
	const [message, setMessage] = React.useState(() => getDefaultMessage());

	React.useEffect(() => {
		simulatorManager.state.on(
			StateEventType.Slices,
			(_slices) => {
				setSlices(_slices);
			},
			"simulator-slices",
		);
		simulatorManager.state.on(
			StateEventType.Message,
			(_message) => {
				setMessage(_message);
			},
			"simulator-message",
		);

		simulatorManager.init();

		return () => {
			simulatorManager.state.off(StateEventType.Slices, "simulator-slices");

			simulatorManager.state.off(StateEventType.Message, "simulator-message");
		};
	}, []);

	const SliceZoneComp = restProps.sliceZone;

	return <div>test</div>;
};
