/*
 * Site content-origin markup tool
 * by Jan Palounek 2012, binaryage.com
 * Options
 *  -d - directory - Input directory
 *  -r - recursive - Walk through directory tree
 *  -h, --help - Display help
 */

var fs = require('fs');
var exec = require('child_process').exec;
var args = process.argv.splice(2);

// Default params
var options = {
	dir: './',
	recursive: true
}

function displayHelp() {
	console.log('Site content-origin markup tool');
 	console.log('by Jan Palounek 2012, binaryage.com');
 	console.log('Options:');
 	console.log(' -d - directory - Input directory');
 	// console.log(' -r - recursive - Walk through directory tree');
 	console.log(' -h, --help - Display help');
}

function walkThrough(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walkThrough(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

for (var i in args) {
	switch(args[i]) {
		case '-d':
			options.dir = args[parseInt(i) + 1];
			break;
		case '-r':
			options.recursive = true;
			break;
		case '-h':
			displayHelp();
			break;
	}
}

if(args.length == 0) {
	displayHelp();
}

// Filter files from input dir
console.log('Will markup: ');

function filterMds(dir, mds) {
	var markupable = [];
	walkThrough(options.dir, function (err, files) {
		if (err) throw err;
		for (var i in files) {
			if(files[i].split('.')[files[i].split('.').length - 1] == 'md') {
				markupable.push(files[i]);
			}
		}
		mds(markupable);
	});
}

function replaceIn(repo, markupable, cb) {
	var replaced = {};
	for(var i in markupable) {
		file = fs.readFileSync(markupable[i]).toString();
		file = file.toString()
		var source = file;
			
		file = file.split('---\n');

		var content = file[2];
		var marked = '<span data-content-origin="' + repo + markupable[i].replace(options.dir, '') + '">' + file[2] + '</span>';

		replaced[markupable[i]] = source.replace(content, marked);
	}

	cb(replaced);
}

filterMds(options.dir, function(mds) {
	// Iterate and markup
	exec('git remote -v', function (error, stdout, stderr) {
		repo = stdout.split('origin	')[1].split(' (fetch)')[0].split(' ').join('');
	
		replaceIn(repo, mds, function (replaced) {
			for(var i in replaced) {
				fs.writeFile(/*'_site/' + */i, replaced[i], function (err) {
  					if (err) throw err;
				});
			}
		});
	});
});

console.log('done');