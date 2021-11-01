'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { Readable } = require('stream');

const STATIC_PATH = path.join(process.cwd(), './static');

const MIME_TYPES = {
	html: 'text/html; charset=UTF-8',
	js: 'application/javascript; charset=UTF-8',
	css: 'text/css',
	png: 'image/png',
	ico: 'image/x-icon',
	svg: 'image/svg+xml',
};

const checkPath = name => {
	const filePath = path.join(STATIC_PATH, name);
	if (!filePath.startsWith(STATIC_PATH)) {
		console.log(`Can't be served: ${name}`);
		return false;
	} else {
		return true;
	}
};

const checkElementPath = async name => {
	if (!checkPath(name)) {
		return null;
	}
	const filePath = path.join(STATIC_PATH, name);
	try {
		const result = await fs.promises.stat(filePath);
		const isFile = result.isFile();
		const isDirectory = result.isDirectory();
		return { isFile, isDirectory };
	} catch (error) {
		console.log(error);
		return null;
	}
};

const serveFile = name => {
	const stream = fs.createReadStream(name);
	return stream;
};

const httpError = (res, statusCode, message) => {
	res.writeHead(statusCode);
	res.end(message);
};

const folderIndex = path => {
	const stream = new Readable({
		read() {
			const files = [];
			const folders = [];
			fs.readdir(path, { withFileTypes: true }, (err, items) => {
				if (err) {
					console.log(`Can't read folder: ${path}`);
					return;
				}
				for (const item of items) {
					if (item.isDirectory()) folders.push(`/${item.name}/`);
					else files.push(item.name);
				}
				const list = folders.concat(files)
					.map(item => `<li><a href="${item}">${item}</a></li>`)
					.join('\n');
				stream.push(`<h2>Directory index:</h2><ul>${list}</ul>`);
				stream.push(null);
			});
		}
	});
	console.log(`Index: ${path}`);
	return stream;
};

http.createServer(async (req, res) => {
	const { url } = req;
	const fileExt = path.extname(url).substring(1);
	const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
	const elemProperty = await checkElementPath(url);
	const filePath = path.join(STATIC_PATH, url);
	if (elemProperty) {
		let stream = null;
		if (elemProperty.isFile) {
			stream = serveFile(filePath);
		}
		if (elemProperty.isDirectory) {
			stream = folderIndex(filePath);
		}
		res.writeHead(200, { 'Content-Type': mimeType });
		if (stream) stream.pipe(res);
		else httpError(res, 404, 'Path is not found');
	} else {
		httpError(res, 404, 'File or directory is not found');
	}

}).listen(8000);
