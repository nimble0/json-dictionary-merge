//http://stamat.wordpress.com/2013/07/03/javascript-object-ordered-property-stringify/
//SORT WITH STRINGIFICATION

var orderedStringify = function(o, fn, separators, indent, indentLevel) {
	var DEFAULT_SEPARATORS = [", ", ": ", "{", "}", "[", "]"];

	separators = Array.isArray(separators) ? separators : [];
	separators = separators.concat(DEFAULT_SEPARATORS.slice(separators.length));
	indent = (typeof(indent) === "string") ? indent : "";
	indentLevel = (typeof(indentLevel) === "number") ? indentLevel : 0;

	return orderedStringify_(o, fn, separators, indent, indentLevel);
}

var orderedStringify_ = function(o, fn, separators, indent, indentLevel) {
	var props = [];
	var res = separators[2];
	for(var i in o) {
		props.push(i);
	}
	props = props.sort(fn);

	for(var i = 0; i < props.length; i++) {
		var val = o[props[i]];
		var type = types[whatis(val)];
		if(type === 3) {
			val = orderedStringify_(val, fn, separators, indent, indentLevel+1);
		} else if(type === 2) {
			val = arrayStringify(val, fn, separators, indent, indentLevel+1);
		} else if(type === 1) {
			val = JSON.stringify(val);
		}

		if(type !== 4)
			res += indent.repeat(indentLevel) + '"'+props[i]+'"' + separators[1] + val + separators[0];
	}

	return res.substring(res, res.lastIndexOf(separators[0])) + separators[3];
};

//orderedStringify for array containing objects
var arrayStringify = function(a, fn, separators, indent, indentLevel) {
	var res = separators[4];
	for(var i = 0; i < a.length; i++) {
		var val = a[i];
		var type = types[whatis(val)];
		if(type === 3) {
			val = orderedStringify_(val, fn, separators, indent, indentLevel+1);
		} else if(type === 2) {
			val = arrayStringify(val, fn, separators, indent, indentLevel+1);
		} else if(type === 1) {
			val = JSON.stringify(val);
		}

		if(type !== 4)
			res += propertySeparator + indent.repeat(indentLevel) + val + separators[0];
	}

	return res.substring(res, res.lastIndexOf(separators[0])) + separators[5];
}

//SORT WITHOUT STRINGIFICATION

var sortProperties = function(o, fn) {
	var props = [];
	var res = {};
	for(var i in o) {
		props.push(i);
	}
	props = props.sort(fn);

	for(var i = 0; i < props.length; i++) {
		var val = o[props[i]];
		var type = types[whatis(val)];

		if(type === 3) {
			val = sortProperties(val, fn);
		} else if(type === 2) {
			val = sortProperiesInArray(val, fn);
		}
		res[props[i]] = val;
	}

	return res;
};

//sortProperties for array containing objects
var sortProperiesInArray = function(a, fn) {
	for(var i = 0; i < a.length; i++) {
		var val = a[i];
		var type = types[whatis(val)];
		if(type === 3) {
			val = sortProperties(val, fn);
		} else if(type === 2) {
			val = sortProperiesInArray(val, fn);
		}
		a[i] = val;
	}

	return a;
}

//HELPER FUNCTIONS

var types = {
	'integer': 0,
	'float': 0,
	'string': 1,
	'array': 2,
	'object': 3,
	'function': 4,
	'regexp': 5,
	'date': 6,
	'null': 7,
	'undefined': 8,
	'boolean': 9
}

var getClass = function(val) {
	return Object.prototype.toString.call(val)
		.match(/^\[object\s(.*)\]$/)[1];
};

var whatis = function(val) {

	if (val === undefined)
		return 'undefined';
	if (val === null)
		return 'null';

	var type = typeof val;

	if (type === 'object')
		type = getClass(val).toLowerCase();

	if (type === 'number') {
		if (val.toString().indexOf('.') > 0)
			return 'float';
		else
			return 'integer';
	}

	return type;
};
