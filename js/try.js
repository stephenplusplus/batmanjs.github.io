// Generated by CoffeeScript 1.6.3
/*
# try.coffee
# Powers the tutorial for batmanjs.org
# This code is pretty much a clusterfuck of hacks
# ... Sorry? <3 Nick
*/


(function() {
  var APP_URL, _ref, _ref1, _ref2, _ref3, _ref4, _ref5,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (window.location.host.indexOf('localhost') !== -1) {
    APP_URL = 'http://localhost:3000';
  } else {
    APP_URL = 'http://batmanrdio.herokuapp.com';
  }

  window.Try = (function(_super) {
    __extends(Try, _super);

    function Try() {
      _ref = Try.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Try.dispatcher = false;

    Try.navigator = false;

    Try.layout = 'layout';

    Try.previewApp = function() {
      var _this = this;
      if (this.previewWindow && !this.previewWindow.closed) {
        return this.previewWindow.focus();
      } else {
        this.previewWindow = window.open("" + APP_URL + "/?preview=true", "app_preview", "width=400,height=600");
        return window.addEventListener('message', function(event) {
          if (event.data !== 'previewReady') {
            return;
          }
          _this.sendPreviewData();
          console.log('running');
          return _this.previewWindow.postMessage('run', '*');
        }, false);
      }
    };

    Try.sendPreviewData = function() {
      this.sendPreviewFile('rdio.js.coffee');
      this.sendPreviewDirectory('lib');
      this.sendPreviewDirectory('controllers');
      this.sendPreviewDirectory('models');
      this.sendPreviewDirectory('views');
      return this.sendPreviewDirectory('html');
    };

    Try.sendPreviewDirectory = function(dir) {
      var _this = this;
      if (typeof dir === 'string') {
        dir = Try.File.findByPath("/app/assets/batman/" + dir);
      }
      if (dir.get('isHidden')) {
        return;
      }
      return dir.get('childFiles').forEach(function(file) {
        return _this.sendPreviewFile(file);
      });
    };

    Try.sendPreviewFile = function(file) {
      if (typeof file === 'string') {
        file = Try.File.findByPath("/app/assets/batman/" + file);
      }
      if (file.get('isHidden')) {
        return;
      }
      return this.previewWindow.postMessage({
        file: file.toJSON()
      }, '*');
    };

    Try.reloadPreview = function() {
      if (!this.previewWindow) {
        return;
      }
      return this.previewWindow.postMessage('reload', '*');
    };

    return Try;

  })(Batman.App);

  Try.LayoutView = (function(_super) {
    __extends(LayoutView, _super);

    function LayoutView(options) {
      options.node = $('.intro')[0];
      LayoutView.__super__.constructor.apply(this, arguments);
    }

    LayoutView.prototype.showFile = function(file) {
      if (file.get('isDirectory')) {
        return file.set('isExpanded', !file.get('isExpanded'));
      } else {
        return file.show();
      }
    };

    LayoutView.prototype.nextStep = function() {
      var index, step;
      index = Try.steps.indexOf(Try.currentStep);
      step = Try.steps[index + 1];
      return step != null ? step.activate() : void 0;
    };

    LayoutView.prototype.completeStep = function() {
      return Try.currentStep.complete();
    };

    return LayoutView;

  })(Batman.View);

  Try.File = (function(_super) {
    __extends(File, _super);

    function File() {
      _ref1 = File.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    File.storageKey = 'app_files';

    File.resourceName = 'files';

    File.persist(Batman.RailsStorage);

    File.findByName = function(name) {
      return this.get('loaded.indexedBy.name').get(name).get('first');
    };

    File.findByPath = function(name) {
      return this.get('loaded.indexedBy.id').get(name).get('first');
    };

    File.classAccessor('topLevel', function() {
      return Try.File.get('all').filter(function(file) {
        return !file.get('parent');
      });
    });

    File.accessor('childFiles', function() {
      var files;
      files = new Batman.Set;
      this.get('children').forEach(function(child) {
        if (child.get('isDirectory')) {
          return files.add.apply(files, child.get('childFiles')._storage);
        } else {
          return files.add(child);
        }
      });
      return files;
    });

    File.encode('name', 'content', 'isDirectory', 'id');

    File.encode('children', {
      decode: function(kids, key, _, __, parent) {
        var file, kid, set, _i, _len;
        set = new Batman.Set;
        for (_i = 0, _len = kids.length; _i < _len; _i++) {
          kid = kids[_i];
          file = Try.File.createFromJSON(kid);
          file.set('parent', parent);
          set.add(file);
        }
        return set;
      }
    });

    File.encode('expectations', {
      decode: function(expectations, key, data) {
        var expectation, _i, _len, _name, _ref2;
        for (_i = 0, _len = expectations.length; _i < _len; _i++) {
          expectation = expectations[_i];
          if ((_ref2 = Try.namedSteps[expectation.stepName]) != null) {
            if (typeof _ref2[_name = expectation.action] === "function") {
              _ref2[_name](data.id, new RegExp(expectation.regex), expectation.completion);
            }
          }
        }
        return null;
      }
    });

    File.prototype.isExpanded = false;

    File.prototype.show = function() {
      return Try.set('currentFile', this);
    };

    return File;

  })(Batman.Model);

  Try.CodeView = (function(_super) {
    var EXTENSIONS;

    __extends(CodeView, _super);

    function CodeView() {
      this.save = __bind(this.save, this);
      _ref2 = CodeView.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    EXTENSIONS = {
      '.html.erb': 'htmlmixed',
      '.html': 'htmlmixed',
      '.coffee': 'coffeescript',
      '.js': 'coffeescript',
      '.js.coffee': 'coffeescript',
      '.rb': 'ruby',
      '.ru': 'ruby',
      'Gemfile': 'ruby'
    };

    CodeView.prototype.modeForFile = function(file) {
      var ext, filename, mode;
      filename = file.get('id');
      for (ext in EXTENSIONS) {
        mode = EXTENSIONS[ext];
        if (filename.indexOf(ext) !== -1) {
          return mode;
        }
      }
    };

    CodeView.prototype.docForFile = function(file) {
      var doc, filename;
      filename = file.get('id');
      this.docs || (this.docs = {});
      if (!(doc = this.docs[filename])) {
        this.set('expectChanges', filename.indexOf('.rb') === -1);
        doc = this.docs[filename] = CodeMirror.Doc(file.get('content'), this.modeForFile(file));
        file.observe('content', function(value) {
          if (value !== doc.getValue()) {
            return doc.setValue(value);
          }
        });
      }
      return doc;
    };

    CodeView.prototype.ready = function() {
      var keys, node,
        _this = this;
      keys = {
        'Cmd-S': this.save,
        'Ctrl-S': this.save
      };
      node = this.get('node');
      this.cm = CodeMirror(node, {
        theme: 'solarized',
        lineNumbers: true,
        extraKeys: keys
      });
      this.cm.getWrapperElement().style.height = "100%";
      return Try.observeAndFire('currentFile', function(file) {
        return setTimeout(function() {
          if (file) {
            _this.cm.swapDoc(_this.docForFile(file));
          }
          _this.cm.setOption('readOnly', !file || !_this.get('expectChanges'));
          return _this.cm.refresh();
        }, 0);
      });
    };

    CodeView.prototype.save = function() {
      Try.set('currentFile.content', this.cm.getValue());
      Try.reloadPreview();
      return Try.fire('fileSaved', Try.get('currentFile'));
    };

    return CodeView;

  })(Batman.View);

  Try.FileView = (function(_super) {
    __extends(FileView, _super);

    function FileView() {
      _ref3 = FileView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    FileView.prototype.html = "<a data-bind=\"file.name\" data-hideif=\"file.isHidden\" data-event-click=\"showFile | withArguments file\" class=\"file\" data-addclass-directory=\"file.isDirectory\" data-addclass-active=\"currentFile | equals file\" data-addclass-expanded=\"file.isExpanded\"></a>\n<ul data-showif=\"file.isDirectory | and file.isExpanded\" data-renderif=\"file.isDirectory\">\n  <li data-foreach-file=\"file.children.sortedBy.isDirectory\">\n    <div data-view=\"FileView\"></div>\n  </li>\n</ul>";

    return FileView;

  })(Batman.View);

  Try.Step = (function(_super) {
    __extends(Step, _super);

    Step.prototype.hasNextStep = true;

    function Step(name, showFiles, block) {
      this.name = name;
      if (!block) {
        block = showFiles;
        showFiles = null;
      }
      this.body = new Batman.Set;
      this.afterBody = new Batman.Set;
      this.fileAppearances = showFiles;
      Try.namedSteps[name] = this;
      Try.steps.push(this);
      block.call(this);
    }

    Step.prototype.activate = function() {
      return Try.set('currentStep', this);
    };

    Step.prototype.title = function(string) {
      return this.set('heading', string);
    };

    Step.prototype.say = function(string) {
      string = string.replace(/`(.*?)`/g, "<code>$1</code>");
      return this.get('body').add(string);
    };

    Step.prototype.after = function(string) {
      string = string.replace(/`(.*?)`/g, "<code>$1</code>");
      return this.get('afterBody').add(string);
    };

    Step.prototype.appear = function(filename, regex, completion) {
      var _base;
      this.appearances || (this.appearances = {});
      return ((_base = this.appearances)[filename] || (_base[filename] = [])).push({
        regex: regex,
        completion: completion
      });
    };

    Step.prototype.complete = function() {
      if (this.isComplete) {
        return;
      }
      this.set('isComplete', true);
      return this.afterComplete();
    };

    Step.prototype.afterComplete = function() {
      var completion, file, filename, match, matches, newString, value, _i, _len, _ref4, _ref5, _results;
      if (this.afterBody.get('length')) {
        this.set('body', this.afterBody);
      }
      if (this.fileAppearances) {
        _ref4 = this.fileAppearances;
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          filename = _ref4[_i];
          Try.File.findByPath(filename).set('isHidden', false);
        }
      }
      _ref5 = this.appearances;
      _results = [];
      for (filename in _ref5) {
        matches = _ref5[filename];
        file = Try.File.findByPath(filename);
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = matches.length; _j < _len1; _j++) {
            match = matches[_j];
            value = file.get('content');
            if (!match.regex.test(value)) {
              completion = match.completion;
              newString = value.substr(0, completion.index);
              newString += completion.value;
              newString += value.substr(completion.index);
              _results1.push(file.set('content', newString));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        })());
      }
      return _results;
    };

    Step.accessor('showNextStepButton', function() {
      return this.get('hasNextStep') && this.get('isComplete');
    });

    return Step;

  })(Batman.Object);

  Try.ConsoleStep = (function(_super) {
    __extends(ConsoleStep, _super);

    function ConsoleStep() {
      _ref4 = ConsoleStep.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    ConsoleStep.prototype.isConsole = true;

    ConsoleStep.prototype.activate = function() {
      ConsoleStep.__super__.activate.apply(this, arguments);
      return $('#terminal-field').val('').attr('disabled', false).focus();
    };

    ConsoleStep.prototype.expect = function(regex, result) {
      this.regex = regex;
      this.result = result;
    };

    ConsoleStep.prototype.check = function(value) {
      if (this.regex.test(value)) {
        this.set('isError', false);
        this.set('isComplete', true);
        this.afterComplete();
        return $('#terminal-field').attr('disabled', true);
      } else {
        return this.set('isError', true);
      }
    };

    return ConsoleStep;

  })(Try.Step);

  Try.CodeStep = (function(_super) {
    __extends(CodeStep, _super);

    function CodeStep() {
      _ref5 = CodeStep.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    CodeStep.prototype.isCode = true;

    CodeStep.prototype.activate = function() {
      var file, filename;
      if (filename = this.focusFile) {
        file = Try.File.findByPath(filename);
        Try.layout.showFile(file);
        while (file = file.get('parent')) {
          file.set('isExpanded', true);
        }
      }
      return CodeStep.__super__.activate.apply(this, arguments);
    };

    CodeStep.prototype.expect = function(filename, regex, completion) {
      var _base;
      this.matches || (this.matches = {});
      return ((_base = this.matches)[filename] || (_base[filename] = [])).push({
        regex: regex,
        completion: completion
      });
    };

    CodeStep.prototype.focus = function(filename) {
      return this.focusFile = filename;
    };

    CodeStep.prototype.complete = function() {
      var completion, file, filename, match, matches, newString, value, _i, _len, _ref6;
      if (this.isComplete) {
        return;
      }
      _ref6 = this.matches;
      for (filename in _ref6) {
        matches = _ref6[filename];
        file = Try.File.findByPath(filename);
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          match = matches[_i];
          value = file.get('content');
          if (!match.regex.test(value)) {
            completion = match.completion;
            newString = value.substr(0, completion.index);
            newString += completion.value;
            newString += value.substr(completion.index);
            file.set('content', newString);
          }
        }
      }
      return CodeStep.__super__.complete.apply(this, arguments);
    };

    return CodeStep;

  })(Try.Step);

  Try.Tutorial = (function() {
    function Tutorial() {
      var _this = this;
      Try.steps = [];
      Try.namedSteps = {};
      Try.on('fileSaved', function(file) {
        var filename, match, matches, value, _i, _len, _ref6;
        _ref6 = Try.currentStep.matches;
        for (filename in _ref6) {
          matches = _ref6[filename];
          file = Try.File.findByPath(filename);
          value = file.get('content');
          for (_i = 0, _len = matches.length; _i < _len; _i++) {
            match = matches[_i];
            if (!match.regex.test(value)) {
              return;
            }
          }
        }
        Try.currentStep.set('isComplete', true);
        return Try.currentStep.afterComplete();
      });
    }

    Tutorial.prototype.c = function(name, showFiles, block) {
      return new Try.CodeStep(name, showFiles, block);
    };

    Tutorial.prototype.$ = function(name, showFiles, block) {
      return new Try.ConsoleStep(name, showFiles, block);
    };

    return Tutorial;

  })();

  $.ajax({
    url: 'js/tutorial.js',
    dataType: 'text',
    success: function(content) {
      eval("with(new Try.Tutorial){" + content + "}");
      return Try.File.load(function() {
        var file, step, _i, _j, _len, _len1, _ref6, _ref7;
        _ref6 = Try.steps;
        for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
          step = _ref6[_i];
          if (step.fileAppearances) {
            _ref7 = step.fileAppearances;
            for (_j = 0, _len1 = _ref7.length; _j < _len1; _j++) {
              file = _ref7[_j];
              Try.File.findByPath(file).set('isHidden', true);
            }
          }
        }
        Try.run();
        Try.steps[0].activate();
        return $('#terminal-field').on('keydown', function(e) {
          var _ref8;
          if (e.keyCode === 13) {
            return (_ref8 = Try.get('currentStep')) != null ? _ref8.check(this.value) : void 0;
          }
        });
      });
    }
  });

}).call(this);
