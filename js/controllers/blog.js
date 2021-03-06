/**
 * Created by Jack on 16/6/18.
 */

var blogModelCtrl = angular.module('blogModelCtrl', []);

blogModelCtrl.controller('blogsCtrl', function ($scope, $rootScope, $cookies, $timeout, $state, toastr, blogs, user) {
    $cookies.get('SessionToken') && user.UserInfo().then(function (resp) {
        $scope.username = resp.data.username;
    }).then(function () {
        $scope.username == $rootScope.Admin ? $scope.add = true: $scope.add = false;
    });
    $rootScope.landing_page = true;
    $scope.blogs = blogs;
    $scope.logout = function () {
        $cookies.remove('SessionToken');
        toastr.success('Success! You have logged out.', $rootScope.message_title);
        $timeout(function () {
            window.location.reload();
        }, 1500);
    }
});

blogModelCtrl.controller('addblogCtrl', function ($scope, $rootScope, $http, $state, $timeout, $cookies, toastr, user) {
    $cookies.get('SessionToken') && user.UserInfo().then(function (resp) {
        $scope.username = resp.data.username;
        $scope.UserId = resp.data.objectId;
    }).then(function () {
        $scope.username != $rootScope.Admin && $rootScope.back();
    });
    $rootScope.landing_page = true;
    $scope.submitForm = function (isValid) {
        if (isValid) {
            var acl = {};
            acl[$scope.UserId] = {"read": true, "write": true};
            acl["*"] = {"read": true};
            var req = {
            method: 'POST',
            url: $rootScope.domain + '/classes/Blog',
            headers: {
                'X-LC-Id': $rootScope.LeanCloudId,
                'X-LC-Key': $rootScope.LeanCloudKey,
                'Content-Type': 'application/json'
            },
            data: {
                'title': $scope.blog_title,
                'content': $scope.summernote_text,
                "ACL": acl
            }};
            $http(req).then(function successCallback(resp) {
                toastr.success('Success! You have added a blog.', $rootScope.message_title);
                $scope.blog_objId = resp.data.objectId;
                $scope.blogs.unshift({
                    'title': $scope.blog_title,
                    'content': $scope.summernote_text,
                    'createdAt': resp.data.createdAt,
                    'objectId': resp.data.objectId
                });
                $timeout(function () {
                    $state.go('blogs.detail', {'blogId': $scope.blog_objId});
                }, 1500);
            }, function errorCallback(resp) {
                toastr.error(resp.data.error, $rootScope.message_title);
            })
        }
    };
    $scope.imageUpload = function(files) {
        for (var i = 0; i < files.length; i++) {
            data = new FormData();
            data.append("file", files[i]);
            $.ajax({
                data: data,
                type: "POST",
                url: $rootScope.domain + '/files/' + files[i].name,
                headers: {
                    'X-LC-Id': $rootScope.LeanCloudId,
                    'X-LC-Key': $rootScope.LeanCloudKey
                },
                cache: false,
                contentType: false,
                processData: false,
                success: function(resp) {
                    $('.summernote').summernote('editor.insertImage', resp.url);
                }
            });
        }
    };
});

blogModelCtrl.controller('blogCtrl', function ($scope, $rootScope, $stateParams, $location, $anchorScroll, $http, $state, $cookies, $timeout, toastr, blogs, utils, user, deleteComment) {
    $rootScope.landing_page = true;
    $scope.commented = false;
    $cookies.get('SessionToken') && user.UserInfo().then(function (resp) {
        $scope.username = resp.data.username;
        $scope.UserId = resp.data.objectId;
    }).then(function () {
        $scope.username == $rootScope.Admin ? $scope.ctrl = true: $scope.ctrl = false;
    });
    $scope.blog = utils.findById($scope.blogs, $stateParams.blogId);
    $scope.blogUrl = 'https://jack614.github.io/#/blogs/' + $stateParams.blogId;
    // comments list
    var req = {
    method: 'GET',
    url: $rootScope.domain + '/classes/Comment',
    headers: {
        'X-LC-Id': $rootScope.LeanCloudId,
        'X-LC-Key': $rootScope.LeanCloudKey,
        'Content-Type': 'application/json'
    },
    params: {
        'where': {'blogId': $stateParams.blogId},
        'order': '-createdAt'
    }};
    $http(req).then(function successCallback(resp) {
        $scope.comments = resp.data.results;
    });
    // comment submit
    $scope.submitForm = function() {
        var endValue = $scope.comment_text.lastIndexOf('</blockquote>');
        if ($scope.comment_text == undefined) {
            toastr.error('Error! Please input your comment!', $rootScope.message_title)
        } else if ($scope.comment_text.substring(endValue).length < 20) {
            toastr.error('Error! Your comment is too short!', $rootScope.message_title)
        } else if ($scope.comment_text.replace(/<p>/g, "").replace(/<\/p>/g, "").replace(/<br>/g, "").replace(/&nbsp;/g, "") != '') {
            var acl = {};
            acl[$scope.UserId] = {"read": true, "write": true};
            acl[$rootScope.AdminId] = {"read": true, "write": true};
            acl["*"] = {"read": true};
            var req = {
            method: 'POST',
            url: $rootScope.domain + '/classes/Comment',
            headers: {
                'X-LC-Id': $rootScope.LeanCloudId,
                'X-LC-Key': $rootScope.LeanCloudKey,
                'Content-Type': 'application/json'
            },
            data: {
                'username': $scope.username,
                'blogId': $stateParams.blogId,
                'content': $scope.comment_text,
                'replyTo': $scope.replyTo,
                "ACL": acl
            }};
            $http(req).then(function successCallback(resp) {
                toastr.success('Success! Tnanks for your comment!.', $rootScope.message_title);
                $scope.comments.unshift({
                    'content': $scope.comment_text,
                    'createdAt': resp.data.createdAt,
                    'objectId': resp.data.objectId,
                    'username': $scope.username
                });
                $scope.commented = true;
            }, function errorCallback(resp) {
                toastr.error(resp.data.error, $rootScope.message_title);
            });
        //} else if ($scope.comment_text.length > 3000) {
        //    toastr.error('Please input your comment!', $rootScope.message_title)
        } else {
            toastr.error('Error! Please input your comment!!', $rootScope.message_title)
        }
    };
    // delete comment
    $scope.delete_comment = function(objectId) {
        $scope.comments = deleteComment.deletebyId(objectId, $scope.comments, $scope.username, $cookies.get('SessionToken'));
    };
    // comment reset
    $scope.text_reset = function() {
        $scope.comment_text = undefined;
    };
    // delete blog
    $scope.delete_blog = function (objectId) {
        if ($scope.username == $rootScope.Admin) {
            for (var i = 0; i < $scope.comments.length; i++) {
                $scope.comments = deleteComment.deletebyId($scope.comments[i].objectId, $scope.comments, $scope.username, $cookies.get('SessionToken'));
            }
            var ImgArray = $scope.blog.content.match(/[a-zA-Z0-9]{40}.[a-zA-Z0-9]{0,5}/g);
            if (ImgArray) {
                var req = {
                method: 'GET',
                url: $rootScope.domain + '/files',
                headers: {
                    'X-LC-Id': $rootScope.LeanCloudId,
                    'X-LC-Key': $rootScope.LeanCloudKey,
                    'Content-Type': 'application/json'
                },
                params: {
                    'where': {"key": {"$in":ImgArray}}
                }};
                $http(req).then(function successCallback(resp) {
                    var Images = resp.data.results;
                    var ReqArray = [];
                    for (var i = 0; i < Images.length; i++) {
                        ReqArray.push({
                            "method": "DELETE",
                            "path": "/1.1/files/" + Images[i].objectId
                        });
                    }
                    var req = {
                    method: 'POST',
                    url: $rootScope.domain + '/batch',
                    headers: {
                        'X-LC-Id': $rootScope.LeanCloudId,
                        'X-LC-Key': $rootScope.LeanCloudKey,
                        'X-LC-Session': $cookies.get('SessionToken'),
                        'Content-Type': 'application/json'
                    },
                    data: {'requests': ReqArray}};
                    $http(req).then(function successCallback(resp) {
                    });
                });
            }
            var req = {
            method: 'DELETE',
            url: $rootScope.domain + '/classes/Blog/' + objectId,
            headers: {
                'X-LC-Id': $rootScope.LeanCloudId,
                'X-LC-Key': $rootScope.LeanCloudKey,
                'X-LC-Session': $cookies.get('SessionToken'),
                'Content-Type': 'application/json'
            }};
            $http(req).then(function successCallback(){
                toastr.success('Success! The blog has been deleted.', $rootScope.message_title);
                $scope.blogs = utils.deletebyId($scope.blogs, objectId);
                $timeout(function () {
                    $state.go('blogs.list');
                }, 1500);
            }, function errorCallback(resp) {
                toastr.error(resp.data.error, $rootScope.message_title);
            });
        }
    };
    $scope.GoTo = function (id, replyTo, comment_content) {
        $scope.commented = false;
        $location.hash(id);
        $scope.replyTo = replyTo;
        var c_text = trimHtml(comment_content, { limit: 50 });
        $scope.comment_text = '<blockquote><p>' + replyTo + ' says:</p>' + c_text.html + '</blockquote><br>';
        $anchorScroll();
    };
    $scope.imageUpload = function(files) {
        for (var i = 0; i < files.length; i++) {
            data = new FormData();
            data.append("file", files[i]);
            $.ajax({
                data: data,
                type: "POST",
                url: $rootScope.domain + '/files/' + files[i].name,
                headers: {
                    'X-LC-Id': $rootScope.LeanCloudId,
                    'X-LC-Key': $rootScope.LeanCloudKey
                },
                cache: false,
                contentType: false,
                processData: false,
                success: function(resp) {
                    $('.summernote').summernote('editor.insertImage', resp.url);
                }
            });
        }
    }
});

blogModelCtrl.controller('editblogCtrl', function ($scope, $rootScope, $stateParams, $cookies, $http, $state, $timeout, toastr, utils, user) {
    $cookies.get('SessionToken') && user.UserInfo().then(function (resp) {
        $scope.username = resp.data.username;
    }).then(function () {
        $scope.username != $rootScope.Admin && $rootScope.back();
    });
    $rootScope.landing_page = true;
    $scope.blog = utils.findById($scope.blogs, $stateParams.blogId);
    $scope.submitForm = function(isValid) {
        if (isValid) {
            var blog_objectId = $scope.blog.objectId;
            var req = {
            method: 'PUT',
            url: $rootScope.domain + '/classes/Blog/' + blog_objectId,
            headers: {
                'X-LC-Id': $rootScope.LeanCloudId,
                'X-LC-Key': $rootScope.LeanCloudKey,
                'X-LC-Session': $cookies.get('SessionToken'),
                'Content-Type': 'application/json'
            },
            data: {
                'title': $scope.blog.title,
                'content': $scope.blog.content
            }};
            $http(req).then(function successCallback() {
                toastr.success('Success! The blog has been updated.', $rootScope.message_title);
                $scope.blogs = utils.editbyId($scope.blogs, blog_objectId, $scope.blog);
                $timeout(function () {
                    $state.go('blogs.detail', {'blogId': blog_objectId});
                }, 1500);
            }, function errorCallback(resp) {
                toastr.error(resp.data.error, $rootScope.message_title);
            });
        }
    }
});