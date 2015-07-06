
ng.directive('softLoopExclude', [
  function() {
    return {
      transclude : 'element',
      priority : 500,
      terminal : true,
      restrict : 'A',
      compile : function(element, attrs, transclude) {
        return function(scope, element) {
          var
            $scope;

          $scope = scope.$softLoop
            ? scope.$newRegular()
            : scope.$new();

          transclude($scope, function(clone) {
            element.after(clone);
          });
        }
      }
    }
  }
]);