import { Op, Transaction, WhereOptions, } from 'sequelize';

export function prepareQuery<T>(query: string, fields: Array<string>): WhereOptions<T> {
	const isNumber = Number(query);
	const where: WhereOptions<T> = {};
	if (query) {
		where[Op.or] = [];
		where[Op.and] = [];
		fields.forEach((field) => {
			where[Op.or].push({
				[field]: isNumber
					? `${isNumber}`
					: {
						[Op.iLike]: `%${decodeURIComponent(query)}%`,
					  },
			});
		});
	}

	return where;
}

export function prepareFileResponse(stream, type, name, header) {
	return header
		.response(stream)
		.type(type)
		.header('Connection', 'keep-alive')
		.header('Cache-Control', 'no-cache')
		.header('Content-Disposition', `attachment;$filename=${name}`);
}

export const transformMultiQuery = (
	query: string | Array<string> | number | Array<number>
): Array<string | number> => (Array.isArray(query) ? [...query] : [query]);
