/**
*	Author: 			Michael Rigamonti
*	Copyright : 	    2022
*	Description:		AuraQuick aura Abstract components

	This file is part of AuraQuick.

	MIT License
    Copyright (c) 2022 Michael Rigamonti

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
 */

({
	/**
	** Manage a generic Javascript exception by log it in the console and showing a toast Message
	** @param	exception	Exception object of the error
	*/
	handleError : function(cmp, event, helper, exception) {
		//console.log("[HLPR] handleError START");
		// Handle error
		console.error(exception);
		// show the Toast Message
		let toastEvent = $A.get("e.force:showToast");
		toastEvent.setParams({title: "Error", mode: "sticky", message: exception.message, type: "error"});
		toastEvent.fire();
		cmp.set("v.AQ_showSpinner", false);
	},

	/**
	** Manage a generic error status (ERROR or INCOMPLETE) in an Apex Call
	** @param	state		String represents the status of the apex call
	** @param	response	The value returned by the apex call
	*/
	manageCallExceptions : function(cmp, event, helper, state, response) {
		//console.log("[HLPR] manageCallExceptions START");
		if(state === "INCOMPLETE") {
			// handle the incomplete state
			console.error("[HLPR] User is offline, device doesn't support drafts.");
			// show the Toast Message
			let toastEvent = $A.get("e.force:showToast");
			toastEvent.setParams({
			    title: "Incomplete",
			    message: $A.get("User is offline, device doesn\'t support drafts."),
			    type: "warning"});
			toastEvent.fire();
		}
		else if(state === "ERROR") {
			let errors = response.getError();
			if(errors) {
				console.error("[HLPR] Error: " + JSON.stringify(errors));
				let errorMessage = "";
				let concurrentError = false;
				for(let i=0; i<errors.length; i++) {
					if(errors[i] && errors[i].message) {
						errorMessage += "\n• " + errors[i].message;
					}
					else if(errors[i] && errors[i].pageErrors) {
					    for(let j=0; j<errors[i].pageErrors.length; j++) {
							errorMessage += '\n• ' + errors[i].pageErrors[j].message;
						}
					}
				}

				if(errorMessage !== "") {
					// show the Toast Message
					let toastEvent = $A.get("e.force:showToast");
					toastEvent.setParams({title: "Error", mode: "sticky", message: errorMessage, type: "error"});
					toastEvent.fire();
				}

			}
			else {
				console.error("Unknown error");
			}
			cmp.set("v.AQ_showSpinner", false);
		}
	},

	/**
	** Generic call to Controller Apex
	** @param	methodName:         Name of the method use in the debud logs
	** @param	actionName:         Name of Action in the Controller Apex
	** @param	parameters:         A List of parameters of Action in the Controller Apex in form of object { "PARAMETER_NAME": Value }
	** @param	callBackFunction    A function in the helper executed in case of SUCCESS
	*/
	callToController : function(cmp, event, helper, methodName, actionName, parameters, callBackFunction) {
		try {
			//console.log("[HLPR] callToController START");
			//console.log("[HLPR] methodName: " + methodName+ " actionName: " + actionName+ " parameters: " + parameters);
			cmp.set("v.AQ_showSpinner", true);
			let action = cmp.get("c." + actionName);

			if(typeof action !== "undefined") {

				action.setParams(parameters);

				action.setCallback(cmp, $A.getCallback(function (response) {
					try {
						let state = response.getState();
						//console.log("[HLPR] " + methodName + " Callback State: " + state);
						if(state === "SUCCESS") {
							let retValue = response.getReturnValue();
							callBackFunction(cmp, event, helper, retValue);
						}
						else {
							helper.manageCallExceptions(cmp, event, helper, state, response);
						}
					}
					catch(e) {
						// Handle error
						helper.handleError(cmp, event, helper, e);
					}
				}));

				action.setBackground();
				$A.enqueueAction(action);
			}
		}
		catch(e) {
			// Handle error
			helper.handleError(cmp, event, helper, e);
		}
	},

	/**
	** Function used to check if a response from server is empty. Use this function in cases you are sure Apex Call need to
	** ALWAYS return a value (do not use for Apex method with VOID return type)
	** @param	retValue:           The value returned from Apex Call
	*/
	manageEmptyResponse : function(cmp, event, helper, retValue, callBackFunction) {
		try {
			if(retValue) {
				callBackFunction(cmp, event, helper, retValue);
			}
			else {
				let errors = $A.get("Server returned an empty response.");
				console.error("[HLPR] manageEmptyResponse Response: "+errors);
				// show the Toast Message
				let toastEvent = $A.get("e.force:showToast");
				toastEvent.setParams({title: "Warning", message: errors, type: "warning"});
				//toastEvent.fire();
				cmp.set("v.AQ_showSpinner", false);
			}
		}
		catch(e) {
			// Handle error
			helper.handleError(cmp, event, helper, e);
		}
	},

	/* **************************************************
	****************** PROMISE MANAGER ******************
	************************************************** */

	/**
	** Generic call to Controller Apex with Promise
	** @param	methodName:         Name of the method use in the debud logs
	** @param	actionName:         Name of Action in the Controller Apex
	** @param	parameters:         A List of parameters of Action in the Controller Apex in form of object { "PARAMETER_NAME": Value }
	** @return						A js Promise for the call
	*/
	callToControllerPromise : function(cmp, event, helper, methodName, actionName, parameters) {
		try {
			//console.log("[HLPR] callToController START");
			//console.log("[HLPR] methodName: " + methodName+ " actionName: " + actionName+ " parameters: " + parameters);
			cmp.set("v.AQ_showSpinner", true);
			let action = cmp.get("c." + actionName);

			if(typeof action !== "undefined") {

				return new Promise(function (resolve, reject) {

					action.setParams(parameters);

					action.setCallback(cmp, $A.getCallback(function (response) {
						try {
							let state = response.getState();
							//console.log("[HLPR] " + methodName + " Callback State: " + state);
							if (cmp.isValid() && state === "SUCCESS") {
								resolve(response.getReturnValue());
							}
							else if (cmp.isValid()) {
								var errors = response.getError();
								reject(response.getError()[0]);
							}
						}
						catch(e) {
							// Handle error
							helper.handleError(cmp, event, helper, e);
						}
					}));

					action.setBackground();
					$A.enqueueAction(action);
				});
			}
		}
		catch(e) {
			// Handle error
			helper.handleError(cmp, event, helper, e);
		}
	}
});