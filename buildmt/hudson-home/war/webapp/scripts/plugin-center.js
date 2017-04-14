/*  
 * ******************************************************************************
 *  Copyright (c) 2012 Oracle Corporation.
 * 
 *  All rights reserved. This program and the accompanying materials
 *  are made available under the terms of the Eclipse Public License v1.0
 *  which accompanies this distribution, and is available at
 *  http://www.eclipse.org/legal/epl-v10.html
 * 
 *  Contributors: 
 * 
 *     Winston Prakash
 *    
 * ******************************************************************************  
 */

jQuery.noConflict();

var filesToUpload;
var updateCount;
var installCount;

var pageInitialized = false;
jQuery(document).ready(function() {

    //To avoid multiple fire of document.ready
    if (pageInitialized) {
        return;
    }
    pageInitialized = true;

    var images = [
        imageRoot + '/green-check.jpg',
        imageRoot + '/progressbar.gif',
        imageRoot + '/error.png',
        imageRoot + '/16x16/warning.png'
    ];

    jQuery(images).each(function() {
        jQuery('<img />').attr('src', this);
    });

    jQuery("#outerTabs").tabs();
    jQuery("#innerTabs").tabs();

    jQuery("#outerTabs tr").hover(
            function() {
                jQuery(this).css("background", "#EEEDED");
            },
            function() {
                jQuery(this).css("background", "");
            }
    );

    var installButton = jQuery('#installButton');
    installButton.button();
    installButton.unbind("click").click(function() {
        var pluginsToInstall = getPluginsToInstall();
        installCount = pluginsToInstall.length;
        if (installCount > 0) {
            jQuery(this).hide();
            jQuery('#installProgress').show();
            jQuery("#pluginInstallMsg").hide();
            jQuery(pluginsToInstall).each(function() {
                installPlugin(this);
            });
        }
    });

    var updateButton = jQuery('#updateButton');
    updateButton.button();
    updateButton.unbind("click").click(function() {
        var pluginsToUpdate = getPluginsToUpdate();
        updateCount = pluginsToUpdate.length;
        if (updateCount > 0) {
            jQuery(this).hide();
            jQuery('#updateProgress').show();
            jQuery("#pluginUpdateMsg").hide();
            jQuery(pluginsToUpdate).each(function() {
                updatePlugin(this);
            });
        }
    });

    jQuery('#installedTab button.enable').each(function() {
        jQuery(this).button();
        jQuery(this).click(function() {
            var selected = this;
            var buttonText = jQuery(selected).children('span').text();
            var title = "Disable Plugin?";
            if (buttonText == "Enable") {
                title = "Enable Plugin?";
                jQuery('#confirmMsg').text("Do you want to enable Plugin - " + jQuery(selected).val() + " ?");
            } else {
                title = "Disable Plugin?";
                jQuery('#confirmMsg').text("Do you want to disable Plugin - " + jQuery(selected).val() + " ?");
            }
            jQuery('#dialog-confirm').dialog({
                resizable: false,
                height: 170,
                width: 350,
                modal: true,
                title: title,
                buttons: {
                    'Yes': function() {
                        jQuery(this).dialog("close");
                        enablePlugin(selected);
                    },
                    Cancel: function() {
                        jQuery(this).dialog("close");
                    }
                }
            });
        });

    });

    jQuery('#installedTab button.downgrade').each(function() {
        jQuery(this).button();
        jQuery(this).click(function() {
            var selected = this;
            var title = "Downgrade Plugin?";
            jQuery('#confirmMsg').text("Do you want to downgrade Plugin - " + jQuery(selected).val() + " ?");

            jQuery('#dialog-confirm').dialog({
                resizable: false,
                height: 170,
                width: 350,
                modal: true,
                title: title,
                buttons: {
                    'Yes': function() {
                        jQuery(this).dialog("close");
                        downgradePlugin(selected);
                    },
                    Cancel: function() {
                        jQuery(this).dialog("close");
                    }
                }
            });
        });

    });

    jQuery('#installedTab button.unpin').each(function() {
        jQuery(this).button();
        jQuery(this).click(function() {
            var selected = this;
            var title = "Unpin Plugin?";
            jQuery('#confirmMsg').text("Do you want to unpin Plugin - " + jQuery(selected).val() + " ?");

            jQuery('#dialog-confirm').dialog({
                resizable: false,
                height: 170,
                width: 350,
                modal: true,
                title: title,
                buttons: {
                    'Yes': function() {
                        jQuery(this).dialog("close");
                        unpinPlugin(selected);
                    },
                    Cancel: function() {
                        jQuery(this).dialog("close");
                    }
                }
            });
        });
    });

    var fileSelect = jQuery('#fileSelect');
    fileSelect.change(function(e) {
        filesToUpload = e.target.files;
    });

    var uploadButton = jQuery('#uploadButton');
    uploadButton.button();
    uploadButton.click(function() {
        for (var i = 0, f; f = filesToUpload[i]; i++) {
            uploadFile(f);
        }
    });

    var progressbar = jQuery('#progressbar');

    progressbar.progressbar({
        value: 0
    });
    progressbar.height(5);

    refreshProxyUser();
    jQuery('#proxyAuth').click(function() {
        refreshProxyUser();
    });

    var proxySubmitButton = jQuery('#proxySubmitButton');
    proxySubmitButton.button();
    proxySubmitButton.click(function() {
        submitPoxyForm();
    });

    var configureUpdateSiteButton = jQuery('#configureUpdateSiteButton');
    configureUpdateSiteButton.button();
    configureUpdateSiteButton.click(function() {
        configureUpdateSite();
    });

    var refreshUpdatesButton = jQuery('#refreshUpdatesButton');
    refreshUpdatesButton.button();
    refreshUpdatesButton.click(function() {
        refreshUpdateCenter();
    });


    jQuery('.category-head').click(function() {
        jQuery(this).next().toggle();
        var child = jQuery(this).children(":eq(0)");
        if (jQuery(child).hasClass("ui-icon-collapsed")) {
            jQuery(child).removeClass("ui-icon-collapsed");
            jQuery(child).addClass("ui-icon-expanded");
        } else {
            jQuery(child).addClass("ui-icon-collapsed");
            jQuery(child).removeClass("ui-icon-expanded");
        }
        return false;
    });


    var pluginSearchButton = jQuery('#pluginSearchButton');
    pluginSearchButton.button();
    pluginSearchButton.click(function() {
        jQuery("#searchPlugins").append("<p>Searching ..</p>")
        var searchStr = jQuery("#pluginSearchText").val();
        var searchDescription = jQuery("#searchDesc").is(':checked');
        jQuery("#searchContents").load('searchPlugins',
                {
                    'searchStr': searchStr,
                    'searchDescription': searchDescription
                }
        );
    });
});

function refreshProxyUser() {
    if (jQuery('#proxyAuth').is(':checked')) {
        jQuery('#proxyUser').show();
        jQuery('#proxyPassword').show();
    } else {
        jQuery('#proxyUser').hide();
        jQuery('#proxyPassword').hide();
    }
}

function getPluginsToInstall() {
    var installables = [];
    jQuery('#availableTab .items-container input[@type=checkbox]:checked').each(function() {
        //Filter out duplicate plugins in different categories
        var pluginName = jQuery(this).val();
        var alreadyAdded = false;
        for (var i = 0; i < installables.length; i++) {
            if (jQuery(installables[1]).val() === pluginName) {
                alreadyAdded = true;
            }
        }
        if (!alreadyAdded) {
            installables.push(this);
        }
    });
    return installables;
}

function getPluginsToUpdate() {
    var updates = [];
    jQuery('#updatesTab .items-container input[@type=checkbox]:checked').each(function() {
        updates.push(this);
    });
    return updates;
}

function getPluginsToDisable() {
    var updates = [];
    jQuery('#installedTab input[@type=checkbox]:checked').each(function() {
        updates.push(this);
    });
    return updates;
}

function installPlugin(selected) {
    jQuery(".install_img_" + jQuery(selected).val()).each(function() {
        jQuery(this).show();
        jQuery(this).attr('src', imageRoot + '/progressbar.gif');
    });

    jQuery(".install_cb_" + jQuery(selected).val()).each(function() {
        jQuery(this).hide();
    });

    jQuery.ajax({
        type: 'POST',
        url: "installPlugin",
        data: {
            pluginName: jQuery(selected).val()
        },
        success: function() {
            jQuery(".install_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/green-check.jpg');
            });
            jQuery(selected).attr("checked", false);
            jQuery('#restart-message').show();
            installCount--;
            if (installCount == 0) {
                jQuery('#installProgress').hide();
                jQuery('#installButton').show();
            }
        },
        error: function(msg) {
            jQuery(".install_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/error.png');
            });
            showMessage(jQuery("#pluginInstallMsg"), msg.responseText, true);
            installCount--;
            if (installCount == 0) {
                jQuery('#installProgress').hide();
                jQuery('#installButton').show();
            }
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function updatePlugin(selected) {
    jQuery(".update_img_" + jQuery(selected).val()).each(function() {
        jQuery(this).show();
        jQuery(this).attr('src', imageRoot + '/progressbar.gif');
    });
    jQuery(".update_cb_" + jQuery(selected).val()).each(function() {
        jQuery(this).hide();
    });
    jQuery.ajax({
        type: 'POST',
        url: "updatePlugin",
        data: {
            pluginName: jQuery(selected).val()
        },
        success: function() {
            jQuery(".update_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/green-check.jpg');
            });
            jQuery(selected).attr("checked", false);
            jQuery('#restart-message').show();
            updateCount--;
            if (updateCount == 0) {
                jQuery('#updateProgress').hide();
                jQuery('#updateButton').show();
            }
        },
        error: function(msg) {
            jQuery(".update_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/error.png');
            });
            showMessage(jQuery("#pluginUpdateMsg"), msg.responseText, true);
            updateCount--;
            if (updateCount == 0) {
                jQuery('#updateProgress').hide();
                jQuery('#updateButton').show();
            }
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function enablePlugin(selected) {
    var enable = false;
    if (jQuery(selected).text() == "Enable") {
        enable = true;
    }

    jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
        jQuery(this).show();
        jQuery(this).attr('src', imageRoot + '/progressbar.gif');
    });

    jQuery.ajax({
        type: 'POST',
        url: "enablePlugin",
        data: {
            pluginName: jQuery(selected).val(),
            enable: enable
        },
        success: function() {
            if (enable) {
                jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
                    jQuery(this).show();
                    jQuery(this).attr('src', imageRoot + '/green-check.jpg');
                });
                jQuery(selected).children('span').text('Disable');
            } else {
                jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
                    jQuery(this).attr('src', imageRoot + '/16x16/warning.png');
                });
                jQuery(selected).children('span').text('Enable');
            }
            jQuery('#restart-message').show();
        },
        error: function(msg) {
            jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/error.png');
            });
            showMessage(jQuery("#pluginActionMsg"), msg.responseText, true);
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function downgradePlugin(selected) {
    jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
        jQuery(this).show();
        jQuery(this).attr('src', imageRoot + '/progressbar.gif');
    });

    jQuery.ajax({
        type: 'POST',
        url: "downgradePlugin",
        data: {
            pluginName: jQuery(selected).val()
        },
        success: function() {
            jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/green-check.jpg');
            });

            jQuery('#restart-message').show();
            jQuery(selected).remove();
        },
        error: function(msg) {
            jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/error.png');
            });
            showMessage(jQuery("#pluginActionMsg"), msg.responseText, true);
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function unpinPlugin(selected) {
    jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
        jQuery(this).show();
        jQuery(this).attr('src', imageRoot + '/progressbar.gif');
    });

    jQuery.ajax({
        type: 'POST',
        url: "unpinPlugin",
        data: {
            pluginName: jQuery(selected).val()
        },
        success: function() {
            jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/green-check.jpg');
            });

            jQuery('#restart-message').show();
            jQuery(selected).parent().remove();
        },
        error: function(msg) {
            jQuery(".installed_img_" + jQuery(selected).val()).each(function() {
                jQuery(this).show();
                jQuery(this).attr('src', imageRoot + '/error.png');
            });
            showMessage(jQuery("#pluginActionMsg"), msg.responseText, true);
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function uploadFile(file) {
    jQuery("#pluginUploadMsg").hide();
    var xhr = new XMLHttpRequest();
    if (xhr.upload) {

        jQuery("#progressbar").show();
        xhr.upload.addEventListener("progress", function(e) {
            var pc = parseInt((e.loaded / e.total) * 100);
            jQuery("#progressbar").progressbar("value", pc);
        }, false);

        // file received/failed
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState == 4) {
                jQuery("#progressbar").hide();
                if (xhr.status == 200) {
                    showMessage(jQuery("#pluginUploadMsg"), "Plugin " + file.name + " sucessfully uploaded.");
                    jQuery('#restart-message').show();
                } else {
                    showMessage(jQuery("#pluginUploadMsg"), xhr.responseText, true);
                }
            }
        };

        // start upload
        xhr.open("POST", "uploadPlugin", true);
        var formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
    }
}

function showMessage(infoTxt, msg, error) {
    infoTxt.text(msg);
    if (error == true) {
        infoTxt.css("color", "red");
    } else {
        infoTxt.css("color", "green");
    }
    infoTxt.show();
}

function submitPoxyForm() {
    forProxy = false;
    showMessage(jQuery("#proxyMsg"), "Configuring proxy ..", "black");
    var dataString = jQuery("#proxyForm").serialize();
    jQuery.ajax({
        type: 'POST',
        url: "proxyConfigure",
        data: dataString,
        success: function() {
            var msg = 'Hudson server could successfully connect to the internet';
            showMessage(jQuery("#proxyMsg"), msg);
        },
        error: function() {
            var msg = 'Hudson server still could not connect to the internet. Check the HTTP proxy settings and try again.';
            showMessage(jQuery("#proxyMsg"), msg, true);
        },
        statusCode: {
            403: function() {
                forProxy = true;
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function configureUpdateSite() {
    jQuery("#configureUpdateSiteMsg").show();
    jQuery("#configureUpdateSiteMsg").text("Configuring ..");
    var dataString = jQuery("#configureUpdateSiteForm").serialize();
    jQuery.ajax({
        type: 'POST',
        url: "configureUpdateSite",
        data: dataString,
        success: function() {
            var msg = 'Update Site Successfully Configured.';
            showMessage(jQuery("#configureUpdateSiteMsg"), msg);
        },
        error: function(msg) {
            //var msg = 'Udate Site could note be Configured. Check the HTTP proxy settings and try again.';
            showMessage(jQuery("#configureUpdateSiteMsg"), msg.responseText, true);
        },
        statusCode: {
            403: function() {
                forProxy = true;
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function refreshUpdateCenter() {
    jQuery("#updateRefreshMsg").show();
    jQuery("#updateRefreshMsg").text("Refreshing ..");
    jQuery.ajax({
        type: 'POST',
        url: "refreshUpdateCenter",
        success: function() {
            window.location.href = ".";
        },
        error: function(msg) {
            //var msg = 'Failed to refresh updates. Check the HTTP proxy settings and try again.';
            showMessage(jQuery("#updateRefreshMsg"), msg.responseText, true);
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        }
    });
}