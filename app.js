function mergeDictionaries(_dictionaries)
{
	var mergedDictionary = _dictionaries[0];
	var conflicts = {};
	_dictionaries.slice(1).forEach(function(dictionary) {
		for(var strokes in dictionary)
			if(mergedDictionary.hasOwnProperty(strokes))
			{
				if(!conflicts.hasOwnProperty(strokes))
					conflicts[strokes] = [mergedDictionary[strokes]];
				conflicts[strokes].push(dictionary[strokes]);
			}
			else
				mergedDictionary[strokes] = dictionary[strokes];
	});

	return {dictionary: mergedDictionary, conflicts: conflicts};
}

angular.module('json-dictionary-merge', [])
	.controller('MergeController', function()
{
	this.addInputDictionary = function()
	{
		this.inputDictionaries.push({text: ""});
	};

	this.removeInputDictionary = function(index)
	{
		this.inputDictionaries.splice(index, 1);
	};

	this.update = function()
	{
		var inputDictionaries_ = [];
		this.inputDictionaries.forEach(function(dictionary) {
			inputDictionaries_.push(JSON.parse(dictionary.text));
		});

		var mergedDictionary = mergeDictionaries(inputDictionaries_);
		this.outputDictionary = mergedDictionary.dictionary;
		this.outputDictionaryJson = JSON.stringify(this.outputDictionary);

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
		this.outputDictionaryJson = JSON.stringify(this.outputDictionary);
	}

	this.inputDictionaries = [];
	this.addInputDictionary();
	this.addInputDictionary();
	this.outputDictionary = {};
	this.outputDictionaryJson = "";

	this.conflicts = {};
});
