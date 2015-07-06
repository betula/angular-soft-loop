
describe('softLoop', function() {
  var
    $compile,
    $scope;

  beforeEach(module('softLoop'));

  function make(html) {
    var
      element;
    element = $compile(html)($scope);
    $scope.$digest();
    return element;
  }

  beforeEach(function() {
    inject(function(_$compile_, _$rootScope_){
      $compile = _$compile_;
      $scope = _$rootScope_;
    });
  });

  it('should work', inject(function() {
    var
      index;

    $scope.tickInner = $scope.tickOuter = function() {};
    spyOn($scope, 'tickInner');
    spyOn($scope, 'tickOuter');
    $scope.value = 0;

    make('<div soft-loop="value"><div ng-bind="tickInner()"></div><div soft-loop-exclude=""><div ng-bind="tickOuter()"></div></div></div>');

    expect($scope.tickInner.calls.count()).toEqual(2);
    expect($scope.tickOuter.calls.count()).toEqual(2);

    for (index = 0; index < 10; index++) {
      $scope.$digest();
    }

    expect($scope.tickInner.calls.count()).toEqual(2);
    expect($scope.tickOuter.calls.count()).toEqual(12);
    $scope.value = 1;
    $scope.$digest();
    expect($scope.tickInner.calls.count()).toEqual(4);
    expect($scope.tickOuter.calls.count()).toEqual(14);

  }));

});