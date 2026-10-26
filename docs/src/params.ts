import { defineParams } from "@sveltejs/kit/params";
import { isBlock, type BlockName } from "#lib/blocks.js";

const matchView = (param: string): param is BlockName => {
	return isBlock(param);
};

export const params = defineParams({
	view: (param) => (matchView(param) ? param : undefined),
});
