/**
 * @author FChowdhury
 */
( function(window) {
	var fileSystem;
	var extension = ".js";
	var ignore = ".svn";
	var currentClass = "";
	var wiki = "";
	var methodList = "";
	var mainInfo = "";
	var wikiPrefix = "";
	var siteCopy=
	{
		doesNotSupport:"Doesn't Support this site"
	}
	var classList = {
		html : "",
		prefix : "<table width='100%'><tr><td colspan='4'><h1>Classes</h1></td></tr>",
		index : 0,
		col1 : "",
		col2 : "",
		col3 : "",
		col4 : "",
		suffix : "</table><br>",
		getHTML : function() {
			this.html += this.prefix;
			this.html += "<tr>";
			this.html += "<td>" + this.col1 + "</td>";
			this.html += "<td>" + this.col2 + "</td>";
			this.html += "<td>" + this.col3 + "</td>";
			this.html += "<td>" + this.col4 + "</td>";
			this.html += "</tr>";
			this.html += this.suffix;
			return this.html;
		}
	}
	function Main() {
		// Note: The file system has been prefixed as of Google Chrome 12:
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		if(window.addEventListener) {
			window.addEventListener("load", onLoad);
		} else {
			window.attachEvent("onload", onLoad);
		}

	}

	function onLoad() {
		if(window.addEventListener) {
			window.removeEventListener("load", onLoad);
		} else {
			window.detachEvent("onload", onLoad);
		}
		document.getElementById("dir").addEventListener("change", onSelectDir);
		if(window.webkitStorageInfo)init();
		if(!document.getElementById("dir").webkitdirectory)document.getElementById("supports"||!window.webkitStorageInfo).innerHTML=siteCopy.doesNotSupport;
	}

	function init() {
		window.webkitStorageInfo.requestQuota(TEMPORARY, 1024 * 1024, function(grantedBytes) {
			window.requestFileSystem(TEMPORARY, grantedBytes, onFileSystem, errorHandler);
		}, function(e) {
			console.log('Error', e);
		});
		BlobBuilderSupported();
	}

	function onFileSystem(fs) {
		fileSystem = fs;

	}

	function onSaveFile() {
		

		

				fileSystem.root.getFile('documentation_new.html', {
					create : true
				}, function(fileEntry) {
					// Create a FileWriter object for our FileEntry (log.txt).
					fileEntry.createWriter(function(fileWriter) {

						fileWriter.onwriteend = function(e) {
							// location.href = fileEntry.toURL();
							document.getElementById("saveDir").download = fileEntry.toURL()
							document.getElementById("saveDir").href = fileEntry.toURL()
							console.log('Write completed.', fileEntry.toURL());
							wiki = "";
						};

						fileWriter.onerror = function(e) {
							console.log('Write failed: ' + e.toString());
						};
						// Create a new Blob and write it to log.txt.
						var bb = new BlobBuilder();
						// Note: window.WebKitBlobBuilder in Chrome 12.
						bb.append(wiki);
						fileWriter.write(bb.getBlob('text/plain'));

					}, errorHandler);
					console.log('File removed.');
				}, errorHandler);
			
		
		// }, errorHandler);
	}

	function onSelectDir(event) {
		console.log(event.target)
		var entries = event.target.files;

		for(var a = 0; a < entries.length; a++) {
			if(entries[a].fileName.indexOf(extension) >= 0 && entries[a].webkitRelativePath.indexOf(ignore) < 0) {
				console.log(entries[a]);

				var file = entries[a];
				var start = 0;
				var stop = file.size - 1;

				var reader = new FileReader();

				// If we use onloadend, we need to check the readyState.
				reader.onloadend = function(evt) {
					if(evt.target.readyState == FileReader.DONE) {// DONE == 2
						getClass(evt.target.result);
					}
				};
				if(file.webkitSlice) {
					var blob = file.webkitSlice(start, stop + 1);
				} else if(file.mozSlice) {
					var blob = file.mozSlice(start, stop + 1);
				}
				reader.readAsBinaryString(blob);
			}

		}
		onSaveFile();
	}

	function addClasssList(cname) {
		// create a class in a table at the top
		if(classList.index > 3)
			classList.index = 0;

		classList["col" + (classList.index + 1)] += "<a href='#class-" + cname + "'>" + cname + "</a><br>";
		classList.index++;
	}

	function getClass(str) {
		var classes = str.split("@class");
		classes.splice(0, 1);

		for(var a = 0; a < classes.length; a++) {
			methodList = "";
			mainInfo = "";
			var currentClasss = classes[a];
			var desc = currentClasss.split("*/")[0].split("@desc");
			if(desc[1]) {
				desc = desc[1].split("\r")[0];
			} else {
				desc = "";
			}
			var cname = currentClasss.split(" ")[1];
			var topLine = currentClasss.split("*/")[1];
			currentClass = cname;
			addClasssList(currentClass);
			//check which type of object this is.
			var lit = false;
			if(topLine.indexOf("function") >= 0) {
				pattern = /@method[\S\s]*?;(\r|\n)/gi;
			} else {
				lit = true;
				pattern = /@method[\S\s]*?,(\r|\n)/gi;
			}
			document.getElementById('progressPercent').innerHTML = (((a + 1) / classes.length) * 100) + "%";
			getMethod(currentClasss.match(pattern), lit);
			wiki += "<table id='" + cname + "' width='100%'><tr><td colspan='2'><b><h1>" + "<a name='class-" + cname + "'>" + cname + " API</a></h1></b><br>&nbsp;&nbsp;" + desc + "<br></td></tr><tr><td valign='top'>" + methodList + "</td><td valign='top'>" + mainInfo + "</td></tr></table>";
		}
		wiki = classList.getHTML() + wiki;
		document.getElementById("saveDir").style.display = "block";
		document.getElementById("copy").value = wiki;
	}

	function getMethod(ar, lit) {

		for(var a = 0; a < ar.length; a++) {
			var pattern = /@method[\S\s]*?/;
			var method = ar[a].replace(pattern, "");
			var meta = method.split("*/");
			method = meta[meta.length - 1];
			meta = meta.toString();
			desc = meta.split("@desc");
			ret = meta.split("@return");
			if(desc[1]) {
				desc = desc[1].split("\r")[0];
			} else {
				desc = null;
			}
			if(ret[1]) {
				ret = ret[1].split("\r")[0];
			} else {
				ret = null;
			}
			method = method.replace("this.", "");
			method = method.split("{")[0];
			var methodName;
			if(lit) {
				methodName = method.split(":")[0];
			} else {
				methodName = method.split("=")[0];
			}
			methodName = methodName.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
			method = method.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
			methodList += "<a href='#" + methodName + "' target='_self'>" + currentClass + "." + methodName + "</a><br>";
			mainInfo += '<a name="' + methodName + '">' + currentClass + "." + methodName + "</a><br><b>Method</b>: " + currentClass + "." + method + "<br><b>Returns</b>: " + ( ret ? ret : "Null") + "<br><b>Description</b>: " + ( desc ? desc : "") + "<br><br>";
		}
	}

	function BlobBuilderSupported() {
		if(window.BlobBuilder) {
			// No change needed - the W3C standard API will be used by default.
		} else if(window.MSBlobBuilder) {
			window.BlobBuilder = window.MSBlobBuilder;
		} else if(window.WebKitBlobBuilder) {
			window.BlobBuilder = window.WebKitBlobBuilder;
		} else if(window.MozBlobBuilder) {
			window.BlobBuilder = window.MozBlobBuilder;
		}
	}

	function errorHandler(e) {
		var msg = '';

		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
				msg = 'QUOTA_EXCEEDED_ERR';
				break;
			case FileError.NOT_FOUND_ERR:
				msg = 'NOT_FOUND_ERR';
				break;
			case FileError.SECURITY_ERR:
				msg = 'SECURITY_ERR';
				break;
			case FileError.INVALID_MODIFICATION_ERR:
				msg = 'INVALID_MODIFICATION_ERR';
				break;
			case FileError.INVALID_STATE_ERR:
				msg = 'INVALID_STATE_ERR';
				break;
			default:
				msg = 'Unknown Error';
				break;
		}

		console.log('Error: ' + msg);
	}

	function getRelativePath(path) {
		return path.replace("htdocs/", "/");
	}

	function readFile(fileEntry) {
		;
		// Get a File object representing the file,
		// then use FileReader to read its contents.
		fileEntry.file(function(file) {
			var reader = new FileReader();

			reader.onloadend = function(e) {
				var txtArea = document.createElement('textarea');
				txtArea.value = this.result;
				document.body.appendChild(txtArea);
			};

			reader.readAsText(file);
		}, errorHandler);
	}

	Main();

}(window));
