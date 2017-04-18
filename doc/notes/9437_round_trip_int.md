---

This work is licensed under the Creative Commons CC0 License

---

# update `masl_round_trip` on build server
### xtUML Project Implementation Note

### 1. Abstract
We have `masl_round_trip` running in the xtuml/models repo on test
models found in masl/test.  We want to run this on any server anywhere
and specifically on build servers hosted by AWS.

### 2. Document References
[1] [9437](https://support.onefact.net/issues/9437) update `masl_round_trip` on build server    

### 3. Background
The BridgePoint team has recently placed the Hudson build server setup
under configuration management at xtuml/buildmt.

### 4. Requirements
4.1 Get roundtrip into the buildmt repository.  
4.2 Enable `masl_round_trip` to run from the command line.  
4.3 Enable `masl_round_trip` to run from a Hudson job.  

### 5. Work Required
5.1. Add roundtrip folder to buildmt.  
5.2. Simplify scripting by building roundtrip.sh.  
5.3. Call roundtrip.sh from Hudson.  

### 6. Implementation Comments
6.1 Removed some hidden scratch folders and files from under hudson-home.  

### 7. Unit Test
7.1 Run `masl_round_trip` regression from the command line.  
7.2 Run `masl_round_trip` regression from the Hudson job.  

### 8. Code Changes

<pre>
Branch name:  9437_round_trip  fork:  cortlandstarrett

</pre>

End
---

