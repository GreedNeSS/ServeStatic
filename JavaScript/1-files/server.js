'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const STATIC_PATH = path.join(process.cwd(), './static');

const MIME_TYPES = {
	html: 'text/html; charset=UTF-8',
	js: 'application/javascript; charset=UTF-8',
	css: 'text/css',
	png: 'image/png',
	ico: 'image/x-icon',
	svg: 'image/svg+xml',
};

const validatePath = async name => {
	const filePath = path.join(STATIC_PATH, name);
	if (!filePath.startsWith(STATIC_PATH)) {
		console.log(`Can't be served: ${name}`);
		return null;
	}
	try {
		const file = await fs.promises.stat(filePath);
		const isFile = file.isFile();
		return isFile;
	} catch (error) {
		console.log(error);
		return false;
	}
};

const serveFile = name => {
	const filePath = path.join(STATIC_PATH, name);
	if (!filePath.startsWith(STATIC_PATH)) {
		console.log(`Can't be served: ${name}`);
		return null;
	}
	const stream = fs.createReadStream(filePath);
	console.log(`Served: ${name}`);
	return stream;
};

const httpError = (res, statusCode, message) => {
	res.writeHead(statusCode);
	res.end(message);
};

http.createServer(async (req, res) => {
	console.log({ url: req.url });
	const { url } = req;
	const name = url === '/' ? '/index.html' : url;
	const fileExt = path.extname(name).substring(1);
	const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
	const fileIsFound = await validatePath(name);
	if (fileIsFound) {
		res.writeHead(200, { 'Content-Type': mimeType });
		const stream = serveFile(name);
		if (stream) stream.pipe(res);
		else httpError(res, 404, 'Path is not found');
	} else {
		httpError(res, 404, 'File is not found');
	}

}).listen(8000);
