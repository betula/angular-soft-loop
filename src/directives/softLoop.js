
ng.directive('softLoop', [
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
            loop = false;

          $scope = scope.$new();
          self = $controller('SoftLoopController');

          self.init($scope);

          scope.$watch(
            attrs.softLoop,
            function(value, prev) {
              if (value !== prev && !loop) {
                loop = true;
                self.loop();
                $scope.$$postDigest(function() {
                  loop = false;
                });
              }
            }
         );

          transclude($scope, function(clone) {
            element.after(clone);
          });
        }
      }
    }
  }
]);