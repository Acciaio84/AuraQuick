# SteelQuick
SteelQuick is a framework for speeding up Salesforce deployments

Content of the framework:

# SQ_AuraAbstract:
This abstract Aura Component contains basic features that all components should have (management of a spinner in the interface and management of communication errors with the server) and the main features able to significantly speed up the development of new aura components. In details:
- SPINNER:
  The component use a lightning:spinner by default, managed during the Apex Call.
  You can turn on/off the visibility of the spinner or turn off (default on) this functionality and use custom spinners
- HANDLE ERROR:
  The method handleError manage a generic Javascript exception by log it in the console and showing a standard toast Message
- MANAGE AN APEX CALL EXCEPTIONS:
  The method manageCallExceptions manage a generic error status (ERROR or INCOMPLETE) in an Apex Call
- APEX CALL TO CONTROLLER:
  The method callToController allow to call an Action in the Controller Apex in a single operation, reducing the code to be written to a minimum and using only the essential information
- APEX CALL TO CONTROLLER BY PROMISE:
  The method callToControllerPromise call an Action in the Controller Apex in a single operation returning a Promise, allowing you manage single or multiple Promises
  
  
# Detailed documentation
  1. CREATE YOUR OWN COMPONENT

  You can can create a new aura component simply by extending this whith the "extends" keyword and your component automatically will inherit attributes and function of this abstract component.
    
    
    AURA COMPONENT ___________________________________
    <aura:component description="MY_COMPONENT_NAME" extends="c:SQ_AuraAbstract" ...>
    __________________________________________________
    
  2. SET the lightning:spinner

  This abstract component use a lightning:spinner by default, managed during the Apex Call. You can use "AT_showSpinner" attribute (default = true) to turn on/off the visibility of the spinner. Generally in the "callBackFunction" you must set it to false to hide spinner when callback is finished. You can also use "AT_enableSpinner" attribute (default = true) to turn off this functionality and use a custom spinner.
    
  3. USE "handleError" FUNCTION
  
  Both in the controller or in the helper of your aura component you can easly manage errors by using try-catch and invoking "helper.handleError". This will log a console error, show a toast message to the user and eventually stop the spinner automatically

    CONTROLLER _______________________________________
    myFunction : function(cmp, event, helper) {
      try {
        console.log("[CTRL] changeCurrency");
        //DO SOMETHING
      }
      catch(e) {
        // Handle error
        helper.handleError(cmp, event, helper, e);
      }
    }
    __________________________________________________
    
  4. USE "callToController" FUNCTION

  Create 2 method in the helper of your component implements this abstract one. The first one is a simple aura function with component, event, helper standard parameters used to call Apex code. Use this first method to instance a javascript object ({ "PARAMETER_NAME": Value }) and fill it with all the parameters needed by the method invoked in the Apex.

  In the sample below at the Apex side we have "myApexMethod" with a single parameter named parentId.
  
    APEX METHOD ______________________________________
    @AuraEnabled(Cacheable=true)
    public static RETURN_TYPE myApexMethod(String parentId) {
    ...
    __________________________________________________
  
  So we use callToController with the following parameters:

  - the "callMyApexMethod" function name,
  - "myApexMethod" that is the name of the method in apex,
  - the object parameters containing the list of parameters
  - and the function we need to call when the callback to apex will be returned successfully

  The second function is an aura function with component, event, helper standard parameters and contains also the results of the callback to apex in the retValue parameter. You can use retValue to to all the logic we need in the aura-side (usually set a component attribute with the result of the apex call).
  If the logic is completed you can turn off the spinner by setting SQ_showSpinner to false.

    HELPER ___________________________________________
    callMyApexMethod : function(cmp, event, helper) { // FIRST METHOD
      console.log("[HLPR] callMyApexMethod");
      let parameters = {};
      parameters.parentId = cmp.get("v.recordId");
      // ADD OTHER PARAMETERS...
      helper.callToController(cmp, event, helper, "callMyApexMethod", "myApexMethod", parameters,  helper.myApexMethodCallBack);
    },
    myApexMethodCallBack : function(cmp, event, helper, retValue) { // SECOND METHOD
      console.log("[HLPR] myApexMethodCallBack");
      cmp.set("v.myAttribute", retValue);
      // SOME OTHER LOGICS...
      cmp.set("v.SQ_showSpinner", false);
    }
    __________________________________________________

  5. USE "callToControllerPromise" FUNCTION

  You can use the same logic of the previous callToController function, but in this case there is no callback function because this method direct return a Promise. If the callback has success status, the function return the results of the callback; in other cases return the error occurred.

  In this way you can manage single or multiple Promises like below:

    HELPER ___________________________________________
    firstCallBack : function(cmp, event, helper, retVal) {
      var p1Results = retVal;
    },
    secondCallBack : function(cmp, event, helper, retVal) {
      var p2Results = retVal;
    },
    ...

    /**
    ** Initialize the Component calling Promises
    */
    initPromises : function(cmp, event, helper)
    {
        let parameters1 = {};
        parameters1.paramName1 = "value1";
        parameters1.paramName2 = "value2";

        let parameters2 = {};
        parameters2.paramName1 = "value1";

      Promise.all(
          [
              helper.callToControllerPromise(cmp, event, helper, "callMyApexMethod1", "myApexMethod1", parameters1),
              helper.callToControllerPromise(cmp, event, helper, "callMyApexMethod2", "myApexMethod2", parameters2),
              ...
          ]
      ).then(
        function(results) {
          helper.firstCallBack(cmp, event, helper, results[0]); //Results from Promise 1
          helper.secondCallBack(cmp, event, helper, results[1]); //Results from Promise 2
          ... //Results from other Promises
              }
          ).catch(function (err) {
        // Handle error
        helper.handleError(cmp, event, helper, err);
          });
    }
    __________________________________________________
