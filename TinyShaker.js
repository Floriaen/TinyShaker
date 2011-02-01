/*

	TODO:
		- buffered (100%) 
			-> integrate the tiny source random into the object
		- random algorithm (100%)
		
		- list of tiny (exclusion possibility)
		- Facebook, Reddit, Twitter shared link
		- timeout on url loading

*/

var Debug = {
	log: function(text) {
		document.getElementById("debug").innerHTML += '<br/>' + text;
	}
};

var TinyUrlState = {
	BORN : 0,
	CHECKING : 1,
	ALIVE : 2,
	DEAD : 3
};

/*************/
/* TINY URL */
/***********/
function TinyUrl(url) {
	this.url = url;
	this._state = TinyUrlState.BORN; //default state
	this._onStateChangeHandler = new Array();
};

TinyUrl.prototype = {
	registerOnStateChangeHandler : function(handler) {
		this._onStateChangeHandler.push(handler);
	},
	
	cleanListeners: function() {
		this._onStateChangeHandler = new Array();
	},
	
	getState : function() {
		return this._state;
	},
	
	setState : function(state) {
		//console.log('#setState : ' + state);
		if (state != this._state) {
			this._state = state;
			if (this._onStateChangeHandler) {
				for (var i=0,l=this._onStateChangeHandler.length; i<l; i++) {
					if (this._onStateChangeHandler[i]) {
						this._onStateChangeHandler[i].call(this);
					}
				}
			}
		}
	}
}

function TinyShaker(useCache) {

	this.useCache = useCache || false;
	this._isCacheInUse = false;
	this._buffer = null;
	if (this.useCache) {
		this._buffer = new Array();
	}
	
	this._currentTinyUrl = null; // from the process
	
	this._source = null;
	this._sources = null;

	////////////////////
	// url param config:
    this.BASEREG = "abcdefghijklmnopqrstuvwxyz0123456789";
    this._baseRegLength = this.BASEREG.length;
	this._currenKeyLength = this.MIN_KEY_LENGTH;	
};

TinyShaker.prototype = {
	
	// array of tinyUrls source(s)
	// if source.length > 0 a random is done
	setSources: function(tinyUrls) {
		
		// TODO: single element allowed
		this._sources = tinyUrls;
	},
	
	refreshSource: function() {
		// TODO if cache is in use, do not refresh...
		//Debug.log(this._buffer.length);
		if (this._buffer.length > 0) {
			return;
		}
		
		// random over the tinyUrl sources:
		if (this._sources) {
			var	l = this._sources.length;
			var r = Math.floor(Math.random() * l);
			this._source = this._sources[r];
		} else {
			// thrown an exception
		}
	},
	
	
    shake: function(onTinyUrlStateChangeHandler) {
		// first of all cancel the current traitement
		this._fireStopCurrentShaking();	
	
		// if something is in cache, use and flush:
		if (this.useCache && this._buffer.length > 0) {
			//Debug.log("_shakeFromBuffer");
			this._shakeFromBuffer(onTinyUrlStateChangeHandler);
		} else {
			// if the script pass here:
			// 1 - the buffering get back a valid url at the end
			// 2 - the buffering is in progress
			//
			// ==> we need to stop the buffering
			
			//Debug.log("_shakeFromScratch");
			this._shakeFromScratch(onTinyUrlStateChangeHandler);
		}
    }, //this.BASEREG

	_shakeFromBuffer: function(onTinyUrlStateChangeHandler) {
		var event = this._buffer.shift();
		var self = this;
		//console.log(event);
		if (event) {
			var tinyUrl = event.tinyUrl;
			tinyUrl.cleanListeners(); // remove all the old listeners
			tinyUrl.registerOnStateChangeHandler(onTinyUrlStateChangeHandler);
			tinyUrl.registerOnStateChangeHandler(function() {
				if (this.getState() == TinyUrlState.ALIVE) {
					//Debug.log("<b>caching...</b>");
					self._fireStartBufferingShake();// fill the cache
				}
			});
			tinyUrl.setState(TinyUrlState.CHECKING);
			setTimeout(function() {
				tinyUrl.setState(event.state);
			}, 0);
		}
	},

	_shakeFromScratch : function(onTinyUrlStateChangeHandler) {
		var self = this;
		var tinyUrl = this._getTinyUrl();
		tinyUrl.registerOnStateChangeHandler(onTinyUrlStateChangeHandler);
		// CACHE OPTION:
		if (true == this.useCache) {
			// on success, the script try to retrieve another valid tiny url
			tinyUrl.registerOnStateChangeHandler(function() {
				if (this.getState() == TinyUrlState.ALIVE) {
					//Debug.log("<b>caching...</b>");
					self._fireStartBufferingShake();// fill the cache
				}
			});
		}
		
		this._checkUrl(tinyUrl);
	},
	
	_fireStopCurrentShaking: function() {
		if (this._currentTinyUrl)
			this._currentTinyUrl.cleanListeners(); // ! important, that will stop definitively the process
	},
	
	_fireStartBufferingShake: function() {
		this._buffer = new Array();
		this.refreshSource();
		this._stopBufferingShake = false;
		this._bufferedShake();
	},
	
	_fireStopAndFlushBufferingShake: function() {
		this._stopBufferingShake = true;
		if (this._currentTinyUrl)
			this._currentTinyUrl.cleanListeners(); // ! important, that will stop definitively the process
	},

	_bufferedShake: function() {
		if (true == this._stopBufferingShake) {
			this._buffer = new Array();
			return; // break the recurrence call
		}
		
		
		this._isCacheInUse = true;
		// wrap the official method:
		
		
		
		var self = this;
		var tinyUrl = this._getTinyUrl();
		tinyUrl.registerOnStateChangeHandler(function() {
			var event = {
				tinyUrl : this,
				state : this.getState()
			};
			if (this.getState() == TinyUrlState.DEAD) {
				
				//Debug.log('_bufferedShake url dead (' + this.url + ')');
				
				self._buffer.push(event);
				// recall the _bufferedShake
				self._bufferedShake();
			} else
			if (this.getState() == TinyUrlState.ALIVE) {
				
				//Debug.log('_bufferedShake url alive (' + this.url + ')');
				
				// TODO maybe we can use this result...
				if (true == this._stopBufferingShake) {
					this._buffer = new Array();
				} else {
					self._buffer.push(event);
				}
				
				self._isCacheInUse = false; // stop and wait
				//console.log(self._buffer);
			} else {
				event = null;
			}		
		});	
		this._checkUrl(tinyUrl);
	},
	
	_setCurrentTinyUrl: function(tinyUrl) {
		// disarmed the current one
		if (this._currentTinyUrl) {
			this._currentTinyUrl.cleanListeners();
		}
		this._currentTinyUrl = tinyUrl; // remember it
	},
/*
	setTiny: function(tiny) {
		this._source = tiny;		
	},
*/	
	_checkUrl: function(tinyUrl) {
		// save as current:
		this._setCurrentTinyUrl(tinyUrl);
		
		// TODO: timeout
		tinyUrl.setState(TinyUrlState.CHECKING);
		Ajax.request("POST", true, "TinyUrl.php", 'url=' + tinyUrl.url, 
			function() {
				var httpCode = parseInt( this.responseText );
				if (!isNaN(httpCode)) {
					if ('200' == httpCode) {
						tinyUrl.setState(TinyUrlState.ALIVE);
					} else {
						tinyUrl.setState(TinyUrlState.DEAD);
					}
				} // stop script error
			}
		);
	},

	_getTinyUrl: function() {
		var reg = this.BASEREG;	
		if (this._source.hasOwnProperty('reg')) {
			reg = this._source['reg'];
		}
		var key = this._getRandomizedKey(reg);
		var url = this._source.url + key;

		var tinyUrl = new TinyUrl(url);
		return tinyUrl;
	},

    _getRandomizedKey: function(reg) {
		var l = reg.length;
		this._updateCurrentKeyLength();
		var key='';
        for (var i = 0; i < this._currenKeyLength; i++) {
            var r = Math.floor(Math.random() * l);
            key += reg[r];
        }
		return key;
    },

	_updateCurrentKeyLength: function() {
		/*
		var range = this._source.range.max - this._source.range.min;
		var r = Math.floor(Math.random() * range);
		this._currenKeyLength = ( this._source.range.min + r );
		*/
		
		this._currenKeyLength = getRandomKeyLengthForRandomKey(this._source.range.min, this._source.range.max, this._baseRegLength);
	}

};

var Ajax={
	POST	: "POST",
	GET		: "GET",
	getHTTPRequest:function() {
		return new XMLHttpRequest();
	},
	request:function( method, async, url, params, onsuccess, onerror ) {
		//console.log( "CALL: " + url + "?" + params );
		
		var ax=Ajax.getHTTPRequest();		
		// METHOD
		if( method == Ajax.GET ) 
		{
			ax.open( Ajax.GET, url += "?" + params, async );
		} else {
			ax.open( Ajax.POST, url, async );
			ax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			ax.setRequestHeader("Content-length", params.length);
			ax.setRequestHeader("Connection", "close");
		}
		
		// SYNCHRO
		if (async == true) 
		{		
			ax.onreadystatechange = function(){
				if (ax.readyState == 4 ) {
					if (ax.status == 200) {
						if (onsuccess) {
							onsuccess.call(ax);	
						}
					} else {
						if (onerror) {
							onerror.call(ax);
						}
					}
				}
			};
			// send
			if( method == Ajax.GET ) ax.send(null);
			else ax.send(params); 	
		} else {
			// send
			if( method == Ajax.GET ) ax.send(null);
			else ax.send(params);
			if (onsuccess) {
				onsuccess.call(ax);
			}
		}
	}
};

function getRandomKeyLengthForRandomKey(minLength, maxLength, baseRegLength ) {
	// get back a random number in the length of possibilities: 
	if (!this.hasOwnProperty['mem_' + maxLength]) {
		// memoize 
		this['mem_' + maxLength] = Math.pow(maxLength, baseRegLength);
	}
	var rand = Math.round((Math.random() * (this['mem_' + maxLength] - 1)) + 1);
	
	for(var keyLength = minLength; keyLength <= maxLength; keyLength++) {
		if (!this.hasOwnProperty['mem_' + keyLength]) {
			// memoize 
			this['mem_' + keyLength] = Math.pow(keyLength, baseRegLength);
		}
		if (rand <= this['mem_' + keyLength]) {
			return keyLength;
		}
	}
	return null;
}