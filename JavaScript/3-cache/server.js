'use strict';

const fs = require('fs').promises;
const http = require('http');
const path = require('path');

const STATIC_PATH = path.join(process.cwd(), './static');
const STATIC_PATH_LENGTH = STATIC_PATH.length;

const MIME_TYPES = {
	html: 'text/html; charset=UTF-8',
	js: 'application/javascript; charset=UTF-8',
	css: 'text/css',
	png: 'image/png',
	ico: 'image/x-icon',
	svg: 'image/svg+xml',
};

const cache = new Map();

const cacheFile = async filePath => {
	const data = await fs.readFile(filePath);
	const key = path.basename(filePath);
	cache.set(key, data);
};

const cacheDirectory = (path, items) => {
	const key = path.substring(STATIC_PATH_LENGTH) + '\\';
	const files = [];
	const folders = [];
	for (const item of items) {
		if (item.isDirectory()) folders.push(`/${item.name}/`);
		else files.push(item.name);
	}
	const list = folders.concat(files)
		.map(item => `<li><a href="${item}">${item}</a></li>`)
		.join('\n');
	const result = `<h2>Directory index:</h2><ul>${list}</ul>`;
	cache.set(key, result);
};

const cacheProject = async directoryPath => {
	const files = await fs.readdir(directoryPath, { withFileTypes: true });
	cacheDirectory(directoryPath, files);
	for (const file of files) {
		const filePath = path.join(directoryPath, file.name);
		if (file.isDirectory()) {
			cacheProject(filePath);
		} else {
			cacheFile(filePath);
		}
	}
};

cacheProject(STATIC_PATH);

const httpResponse = (res, statusCode, message, headObj = null) => {
	if (headObj) res.writeHead(statusCode, headObj);
	else res.writeHead(statusCode);
	res.end(message);
};

http.createServer((req, res) => {
	const { url } = req;
	const fileExt = path.extname(url).substring(1);
	const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
	const pathForWin = path.normalize(url);   //! for Windows
	console.log({ path: pathForWin, url });
	if (
		cache.has(pathForWin) ||
		cache.has(pathForWin + '\\') ||
		cache.has(path.basename(pathForWin))
	) {
		const data = cache.get(pathForWin) ||
			cache.get(pathForWin + '\\') ||
			cache.get(path.basename(pathForWin));
		httpResponse(res, 200, data, { 'Content-Type': mimeType });
	} else {
		httpResponse(res, 404, 'Path is not found');
	}
}).listen(8000);
