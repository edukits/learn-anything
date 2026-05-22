export type MetricItem = {
	id: string;
	label: string;
	value: string | number;
};

export type DeviceStatItem = {
	device: string;
	attempted: number;
	correct: number;
};
