
ng.controller('SoftLoopController', [
  '$rootScope',
  function($rootScope) {
    var
      scopes = [],
      lastDirtyWatchNull,
      initialized = false;

    this.phase = false;

    this.init = function(scope) {
      if (initialized) {
        return;
      }
      initialized = true;

      this.scopeDecorate(scope);

      // Hack for null lastDirtyWatch
      // @see https://github.com/angular/angular.js/blob/v1.2.10/src/ng/rootScope.js#L356
      lastDirtyWatchNull = $rootScope.$watch();

      scope.$on('$destroy', function() {
        scopes.length = 0;
        lastDirtyWatchNull();
      });
    };

    this.loop = function() {
      var
        self = this;

      this.phase = true;

      scopes.forEach(function(scope) {
        scope.$$softLoopWatchers.enable();
      });

      lastDirtyWatchNull();
      $rootScope.$$postDigest(function() {

        scopes.forEach(function(scope) {
          scope.$$softLoopWatchers.disable();
        });

        self.phase = false;
      });
    };

    this.scopeDecorate = function(scope) {
      var
        self = this;

      scopes.unshift(scope);

      scope.$softLoop = true;
      scope.$$softLoopWatchers = [];

      ['enable', 'disable', 'free'].forEach(function(name) {
        scope.$$softLoopWatchers[ name ] = function() {
          this.forEach(function(watcher) {
            watcher[ name ]();
          });
        };
      });

      scope.$on('$destroy', function() {
        scope.$$softLoopWatchers.free();
        scope.$$softLoopWatchers.length = 0;
        arrayRemove(scopes, scope);
      });

      scope.$newRegular = function(isolate) {
        var
          self = scope.$new(isolate);
        if (self.$softLoop) {
          self.$new = self.constructor.prototype.$new;
          self.$watch = self.constructor.prototype.$watch;
          self.$$softLoopWatchers.enable();
          self.$$softLoopWatchers.free();
          self.$$softLoopWatchers.length = 0;
          self.$softLoop = false;
        }
        return self;
      };

      scope.$softLoopDigest = function() {
        if (! $rootScope.$$phase) {
          scope.$digest();
        }
        else if (! self.phase) {
          self.loop();
        }
      };

      scope.$apply = function() {
        if (! self.phase) {
          self.loop();
        }
        return this.constructor.prototype.$apply.apply(scope, arguments);
      };

      scope.$digest = function() {
        if (! self.phase) {
          self.loop();
        }
        return this.constructor.prototype.$digest.apply(scope, arguments);
      };

      scope.$new = function(isolate) {
        var
          childScope;

        // @see https://github.com/angular/angular.js/blob/v1.2.10/src/ng/rootScope.js#L176
        childScope =  this.constructor.prototype.$new.call(scope, isolate);
        return self.scopeDecorate(childScope);
      };

      scope.$watch = function(watchExp, listener, objectEquality) {
        var
          watcher,
          watcherCtrl,
          enabled,
          unwatch;

        // @see https://github.com/angular/angular.js/blob/v1.2.10/src/ng/rootScope.js#L319
        unwatch = this.constructor.prototype.$watch.call(
          scope,
          watchExp,
          listener,
          objectEquality
       );
        watcher = scope.$$watchers[0];
        enabled = true;

        watcherCtrl = {
          enable : function() {
            if (!enabled) {
              scope.$$watchers.unshift(watcher);
              enabled = true;
            }
          },
          disable : function() {
            if (enabled) {
              arrayRemove(scope.$$watchers, watcher);
              enabled = false;
            }
          },
          destroy : function() {
            enabled = false;
            arrayRemove(scope.$$softLoopWatchers, watcherCtrl);
            arrayRemove(scope.$$watchers, watcher);
            unwatch && unwatch();
            watcherCtrl && watcherCtrl.free && watcherCtrl.free();
          },
          free : function() {
            delete this.enable;
            delete this.disable;
            delete this.destroy;
            unwatch = watcher = watcherCtrl = undefined;
          }
        };

        scope.$$postDigest(function() {
          watcherCtrl && watcherCtrl.disable();
        });

        scope.$$softLoopWatchers.unshift(watcherCtrl);

        return watcherCtrl.destroy;
      };

      return scope;
    };

    function arrayRemove(array, value) {
      var index = array.indexOf(value);
      if (index >= 0) {
        array.splice(index, 1);
      }
      return value;
    }

  }
]);