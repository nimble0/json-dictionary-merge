function mergeDictionaries(_dictionaries)
{
	var mergedDictionary = (_dictionaries[0] === undefined) ? {} : _dictionaries[0];
	var conflicts = {};
	_dictionaries.slice(1).forEach(function(dictionary) {
		Object.keys(dictionary).forEach(function(strokes) {
			if(mergedDictionary.hasOwnProperty(strokes)
				&& mergedDictionary[strokes] !== dictionary[strokes]
				&& (!conflicts.hasOwnProperty(strokes)
					|| conflicts[strokes].indexOf(dictionary[strokes]) === -1))
			{
				if(!conflicts.hasOwnProperty(strokes))
					conflicts[strokes] = [mergedDictionary[strokes]];
				conflicts[strokes].push(dictionary[strokes]);
			}
			else
				mergedDictionary[strokes] = dictionary[strokes];
		});
	});

	return {dictionary: mergedDictionary, conflicts: conflicts};
}

function downloadBlob(_blob, _fileName)
{
	var downloadLink = document.createElement("a");
	downloadLink.download = _fileName;
	downloadLink.innerHTML = "Download File";
	downloadLink.href = window.URL.createObjectURL(_blob);
	downloadLink.onclick = function(event) { document.body.removeChild(event.target); };
	downloadLink.style.display = "none";
	document.body.appendChild(downloadLink);

	downloadLink.click();
}

angular.module('json-dictionary-merge', [])
.filter('toArray', function() {
	return function(_input, _keyName) {
		if(!(_input instanceof Object))
			return _input;

		return Object.keys(_input).map(function(key) {
			return Object.defineProperty(_input[key], _keyName, {__proto__: null, value: key});
		});
	}
})
.directive("filesInput", function() {
	return {
		require: "ngModel",
		link: function postLink(_scope, _elem, _attrs, _ngModel) {
			_elem.on("change", function() {
				_ngModel.$setViewValue(_elem[0].files);
			});
		}
	}
})
.directive("onFilesChange", function() {
	return {
		restrict: "A",
		priority: 100,
		link: function(_scope, _elem, _attrs) {
			_elem.bind('change', function() {
				_scope.$apply(function() {
					_scope.$eval(_attrs.onFilesChange)
				});
			});
		}
	}
})
.controller('MergeController', function($scope)
{
	this.addInputFile = function()
	{
		this.inputFiles.push({text: ""});
		setTimeout(function() {
			var newFile = document.querySelector(".files>li:last-child>input[type=file]");
			if(newFile !== null)
				newFile.click();
		}, 0);
	};

	this.removeInputFile = function(_index)
	{
		this.inputFiles.splice(_index, 1);
		this.findConflicts();
	};

	this.inputFileSelected = function(_file)
	{
		this.outputDictionary = null;

		var count = { _: _file.files.length};
		this_ = this;

		_file.content = [];
		for(var i = 0; i < _file.files.length; ++i)
		{
			var file = _file.files[i];
			var fileReader = new FileReader();
			fileReader.onload = function(e) {
				_file.content.push(JSON.parse(e.target.result));
				if(--count._ == 0)
					$scope.$apply(function() { this_.findConflicts(); });
			};
			fileReader.readAsText(file, "UTF-8");
		}

		if(_file.files.length == 0)
			this.findConflicts();
	};

	this.mergeDictionaries = function()
	{
		var inputDictionaries = [];
		this.inputFiles.forEach(function(file) {
			if(file.hasOwnProperty("content"))
				file.content.forEach(function(content) {
					inputDictionaries.push(content);
				});
		});

		return mergeDictionaries(inputDictionaries);
	};

	this.findConflicts = function()
	{
		var mergedDictionary = this.mergeDictionaries();
		this.outputDictionary = mergedDictionary.dictionary;

		var conflicts = {}
		for(var strokes in mergedDictionary.conflicts)
			conflicts[strokes] = {
				options: mergedDictionary.conflicts[strokes],
				selectedOption: mergedDictionary.conflicts[strokes][0]
			};
		this.conflicts = conflicts;
	};

	this.conflictOptionSelected = function(_strokes, _selectedOption)
	{
		this.outputDictionary[_strokes] = _selectedOption;
	};

	this.saveMergedDictionary = function()
	{
		if(this.outputDictionary === null)
			this.outputDictionary = this.mergeDictionaries().dictionary;

		var outputJson = JSON.stringify(this.outputDictionary, null, "\t").replace(/\t/g, "");
		downloadBlob(new Blob([outputJson], {type: "application/json"}), "merged.json");
	};

	this.inputFiles = [{text: ""}];
	this.outputDictionary = {};

	this.conflicts = {};
});
