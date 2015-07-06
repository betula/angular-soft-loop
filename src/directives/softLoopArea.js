
ng.directive('softLoopArea', [
  '$controller',
  function($controller) {
    return {
      transclude : 'element',
      priority : 200,
      terminal : true,
      restrict : 'A',
      compile : function(element, attrs, transclude) {
        return function(scope, element) {
          var
            $scope,
            self,
            initialized = false;

          $scope = scope.$new();
          self = $controller('SoftLoopController');

          self.init($scope);

          $scope.$$postDigest(function() {
            initialized = true;
          });

          scope.$watch(function() {
            if (!initialized || self.phase) {
              return;
            }
            self.loop();
          });

          transclude($scope, function(clone) {
            element.after(clone);
          });
        }
      }
    }
  }
]);