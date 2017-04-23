function mergeDictionaries(_dictionaries)
{
	var mergedDictionary = {};
	var conflicts = {};
	_dictionaries.forEach(function(dictionary) {
		Object.keys(dictionary).forEach(function(strokes) {
			if(!mergedDictionary.hasOwnProperty(strokes))
				mergedDictionary[strokes] = dictionary[strokes];
			else if(mergedDictionary[strokes] !== dictionary[strokes])
			{
				if(!conflicts.hasOwnProperty(strokes))
					conflicts[strokes] = [mergedDictionary[strokes]];
				if(conflicts[strokes].indexOf(dictionary[strokes]) === -1)
					conflicts[strokes].push(dictionary[strokes]);
			}
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

	this.inputFileSelected = function(_inputFile)
	{
		_inputFile.goodFiles = [];
		_inputFile.badFiles = [];
		this.outputDictionary = null;

		var count = { _: _inputFile.files.length};
		this_ = this;

		_inputFile.content = [];
		for(var i = 0; i < _inputFile.files.length; ++i)
		{
			var file = _inputFile.files[i];
			var fileReader = new FileReader();
			fileReader.onloadend = function(_file)
			{
				return function(e)
				{
					try
					{
						if(e.target.readyState !== 2 || e.target.error !== null)
							throw "FileReader Error";
						_inputFile.content.push(JSON.parse(e.target.result));
						_inputFile.goodFiles.push({name: _file.name});
					}
					catch(error)
					{
						_inputFile.badFiles.push({name: _file.name});
					}

					if(--count._ === 0)
						$scope.$apply(function() { this_.findConflicts(); });
				};
			}(file);
			fileReader.readAsText(file, "UTF-8");
		}

		if(_inputFile.files.length === 0)
			this.findConflicts();
	};

	this.updateFileLists = function()
	{
		this_ = this;

		this.goodFiles = [];
		this.inputFiles.forEach(function(file) {
			if(file.hasOwnProperty("goodFiles"))
				file.goodFiles.forEach(function(file) {
					this_.goodFiles.push(file);
				});
		});

		this.badFiles = [];
		this.inputFiles.forEach(function(file) {
			if(file.hasOwnProperty("badFiles"))
				file.badFiles.forEach(function(file) {
					this_.badFiles.push(file);
				});
		});
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
		this.updateFileLists();

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

		var outputJson = orderedStringify(
			this.outputDictionary,
			undefined,
			[",\n", ": ", "{\n", "\n}\n", "[\n", "\n]\n"]);
		downloadBlob(new Blob([outputJson], {type: "application/json"}), "merged.json");
	};

	this.inputFiles = [{text: ""}];
	this.goodFiles = [];
	this.badFiles = [];
	this.outputDictionary = {};

	this.conflicts = {};
});
