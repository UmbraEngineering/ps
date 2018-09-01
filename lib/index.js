
const { spawn } = require('ps');

const validFields = new Set([
	'group', 'ppid', 'user', 'args', 'comm', 'rgroup', 'nice', 'pid', 'pgid', 'etime',
	'ruser', 'time', 'tty', 'vsz'
]);

const lookup = async ({ pid, ppid, user, group, command, all, fields = ['pid', 'ppid', 'comm'] }) => {
	if (! fields.every((field) => validFields.has(field))) {
		throw new Error('ps - invalid field provided');
	}

	if (ppid && fields.indexOf('ppid') < 0) {
		fields.push('ppid');
	}

	const fieldOptions = fields.reduce(reduceFieldsToOptions, [ ]);

	if (pid) {
		const output = await ps([ '-p', processPids(pid), ...fieldOptions ]);

		return parseGrid(output, fields);
	}

	if (ppid) {
		const pids = processPids(ppid);
		const ppidSet = new Set(String(pids).split(','));
		const output = await ps([ '-p', pids, ...fieldOptions ]);
		const processes = parseGrid(output, fields);

		// 
	}

	if (all) {
		const output = await ps([ '-e', ...fieldOptions ]);

		return parseGrid(output, fields);
	}

	if (user) {
		const output = await ps([ '-u', user, ...fieldOptions ]);

		return parseGrid(output, fields);
	}

	if (group) {
		const output = await ps([ '-g', group, ...fieldOptions ]);

		return parseGrid(output, fields);
	}

	if (command) {
		const output = await ps([ '-C', command, ...fieldOptions ]);

		return parseGrid(output, fields);
	}

	throw new Error('ps - must provide a search query; one of "pid", "ppid", "all", "user", "group", "command"');
};

// Export
module.exports = lookup;
lookup.lookup = lookup;

class Process {
	constructor(fields) {
		Object.assign(this, fields);
		Object.freeze(this);
	}
}

// Turns ['comm', 'pid'] into ['-o', 'comm', '-o', 'pid']
const reduceFieldsToOptions = (options, field) => {
	options.push('-o', field);

	return options;
};

const ps = (args, callback) => {
	return new Promise((resolve, reject) => {
		const child = spawn('ps' args);

		let stdout = '';
		let stderr = '';

		child.on('error', (error) => {
			reject(error);
		});

		child.stdout.on('data', (data) => stdout += data);
		child.stderr.on('data', (data) => stderr += data);

		child.on('close', (code) => {
			stderr = stderr.trim();

			if (stderr) {
				return reject(new Error(stderr));
			}

			resolve(stdout.trim());
		});
	});
};

const isValidPid = (pid) => {
	return String(parseInt(pid, 10)) === pid;
};

const processPids = (pid) => {
	if (Array.isArray(pid)) {
		if (! pid.every(isValidPid)) {
			throw new Error('ps - pid must be a valid integer value');
		}

		return pid.join(',');
	}

	if (! isValidPid(pid)) {
		throw new Error('ps - pid must be a valid integer value');
	}

	return pid;
}

// Parses the resulting output from ps into `Process` objects
const parseGrid = (output, fields) => {
	if (! output) {
		return [ ];
	}

	return output.split('\n').map((line) => {
		const proc = { };

		line.split(/\s+/).forEach((item, index) => {
			if (item) {
				proc[fields[index]] = item;
			}
		});
		
		return new Process(proc);
	});
};





/*
exports.lookup = function(query, callback) {
	var format = query.format;
	
	// Lookup by PID
	if (query.pid) {
		format = parseFormat(format || 'comm pid');

		var pid = Array.isArray(pid)
			? pid.join(',')
			: query.pid;

		return exports([ '-p', pid, '-o', format ], function(err, output) {
			if (err) {
				return callback(err);
			}
			if (query.parse) {
				output = parseGrid(output);
			}
			callback(null, output);
		});
	}

	// Lookup by PPID
	if (query.ppid) {
		format = format || 'comm pid ppid';
		columns = format.split(' ');
		format = parseFormat(format);

		// Parsing is required for ppid queries as we do the filtering internally
		if (query.parse === void(0)) {
			query.parse = true;
		}
		if (! query.parse) {
			throw new Error('ps: the `parse` option cannot be false for ppid queries');
		}

		var ppid = Array.isArray(query.ppid)
			? query.ppid.join(',')
			: query.ppid;

		return exports([ '-p', ppid, '-o', format ], function(err, output) {
			if (err) {
				return callback(err);
			}

			output = parseGrid(output);
			var ppidIndex = columns.indexOf('ppid');

			var ppids = query.ppid;
			if (typeof ppids === 'string') {
				ppids = query.ppid.split(',');
			}
			if (typeof ppids === 'number') {
				ppids = [ ppids ];
			}

			ppids = ppids.map(String);
			output = output.filter(function(line) {
				return (ppids.indexOf(line[ppidIndex]) >= 0);
			});

			callback(null, output);
		});
	}
};
*/