/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 * @author Cycle
 */

define([
  "N/record",
  "N/search",
  "N/runtime",
  "N/log",
  "N/file",
  "N/encode",
  "N/format",
], function (record, search, runtime, log, file, encode, format) {
  // Account ID that this restlet was deployed for - injected during SDF deployment
  // This constant is compared against the expectedAccountId sent from the backend
  const DEPLOYED_ACCOUNT_ID = "1233958_SB1";

  // Per-invocation folder-ID cache. A RESTlet invocation often touches many
  // files inside the same deep folder (e.g. `SuiteScripts/A/B/*.js`). Without
  // caching, getPathContent64 burns one search governance unit per segment per
  // file. The cache key is the full "/"-joined folder path; value is the
  // NetSuite folder internal ID. Cleared at the top of every doPost so no
  // state leaks between requests.
  let folderIdCache = Object.create(null);

  // Per-invocation custom folder name. When set, .cycleignore patterns are
  // matched against repo-relative paths (FC path minus the custom folder
  // prefix). Cleared at the top of every doPost.
  let customFolder = null;

  /**
   * Validates that the deployed account ID matches the expected account ID from the backend.
   * This detects sandbox refresh scenarios where the restlet was deployed for a different account.
   * @param {string|null} expectedAccountId - The account ID sent from the backend (optional)
   * @returns {Object|null} Returns error object if validation fails, null if validation passes or skipped
   */
  function validateAccountId(expectedAccountId) {
    // Skip validation if no account ID was provided in the request
    if (!expectedAccountId) {
      return null;
    }

    if (DEPLOYED_ACCOUNT_ID !== expectedAccountId) {
      log.error("Account Mismatch Detected", {
        deployedAccountId: DEPLOYED_ACCOUNT_ID,
        expectedAccountId: expectedAccountId,
        message: "Possible sandbox refresh detected - restlet was deployed for a different account"
      });

      return {
        success: false,
        error: "ACCOUNT_MISMATCH",
        message: "Account ID mismatch detected. This may indicate a sandbox refresh.",
        deployedAccountId: DEPLOYED_ACCOUNT_ID,
        expectedAccountId: expectedAccountId
      };
    }

    return null;
  }

  const BATCH_USAGE_THRESHOLD = 100;
  const DEFAULT_ROOT_FOLDER_NAME = "SuiteScripts";

  /**
   * Resolve the list of top-level folders the request wants to scan.
   *
   * The backend sends one of:
   *   - rootFolders: string[] — preferred, multi-root aware (Option B)
   *   - suiteScriptsFolder: string — legacy single-root; also used as fallback
   *
   * Each name is looked up via getFolderIdByPath (top-level). Missing folders
   * are dropped with a warning so one misconfigured entry doesn't block the
   * whole sync.
   *
   * @returns {{ resolved: Array<{id:number,name:string}>, missing: string[] }}
   */
  function resolveRootFolders(requestBody) {
    const names =
      Array.isArray(requestBody.rootFolders) && requestBody.rootFolders.length
        ? requestBody.rootFolders
        : [requestBody.suiteScriptsFolder || DEFAULT_ROOT_FOLDER_NAME];

    const resolved = [];
    const missing = [];

    for (const name of names) {
      if (!name) continue;
      const id = getFolderIdByPath(name);
      if (id) {
        resolved.push({ id: Number(id), name: name });
      } else {
        missing.push(name);
      }
    }

    return { resolved: resolved, missing: missing };
  }

  // Global log collector for sending logs to backend
  const logCollector = {
    logs: [],
    maxLogs: 100, // Limit number of logs to avoid large responses

    add: function (level, title, details) {
      if (this.logs.length >= this.maxLogs) return; // Don't exceed max

      this.logs.push({
        timestamp: new Date().toISOString(),
        level: level,
        title: title,
        details: details,
      });
    },

    clear: function () {
      this.logs = [];
    },

    get: function () {
      return this.logs;
    },
  };

  // Wrapper functions for logging that also collect logs
  const logger = {
    debug: function (title, details) {
      log.debug(title, details);
      logCollector.add("DEBUG", title, details);
    },

    audit: function (title, details) {
      log.audit(title, details);
      logCollector.add("AUDIT", title, details);
    },

    error: function (title, details) {
      log.error(title, details);
      logCollector.add("ERROR", title, details);
    },
  };

  function createErrorObject(
    err,
    path = null,
    fileName = null,
    additionalData = {}
  ) {
    const errorObj = {
      message: err.message || err.toString(),
      stack: err.stack || null,
      ...additionalData,
    };

    if (path) errorObj.path = path;
    if (fileName) errorObj.fileName = fileName;
    // Add error name/type if available
    if (err.name) errorObj.errorType = err.name;
    // Add error code if available (NetSuite errors often have this)
    if (err.code) errorObj.errorCode = err.code;

    return errorObj;
  }

  function parseNetSuiteDateToUTC(modifiedStr) {
    // modifiedStr example: "10/31/2025 1:32 pm"
    // Use NetSuite's format.parse() to correctly handle timezone conversion
    try {
      // Parse the date string using NetSuite's format module
      // This automatically handles the account's timezone settings
      const parsedDate = format.parse({
        value: modifiedStr,
        type: format.Type.DATETIMETZ,
      });

      return parsedDate;
    } catch (err) {
      logger.error({
        title: "parseNetSuiteDateToUTC Error",
        details: JSON.stringify({
          input: modifiedStr,
          error: err.message,
          stack: err.stack,
        }),
      });
      // Re-throw with context so caller can handle
      const enhancedError = new Error(
        `Failed to parse date '${modifiedStr}': ${err.message}`
      );
      enhancedError.name = err.name;
      enhancedError.code = err.code;
      enhancedError.stack = err.stack;
      enhancedError.inputDate = modifiedStr;
      throw enhancedError;
    }
  }

  //Get only server Date portion from an UTC datetime
  function parseUTCToServerDate(filterDateUTC) {
    const filterDate =
      typeof filterDateUTC === "string"
        ? new Date(filterDateUTC)
        : filterDateUTC;

    logger.debug({
      title: "Filter date UTC (input)",
      details: filterDate.toISOString(),
    });

    const nsDateTime = format.format({
      value: filterDate,
      type: format.Type.DATETIMETZ,
    });

    // Now extract just the date portion from the server's timezone
    return format.format({
      value: format.parse({
        value: nsDateTime,
        type: format.Type.DATETIMETZ,
      }),
      type: format.Type.DATE,
    });
  }

  function doGet(requestParams) {
    // Validate account ID if provided in the request
    var accountValidationError = validateAccountId(requestParams.expectedAccountId);
    if (accountValidationError) {
      return accountValidationError;
    }

    logger.debug(
      "RESTlet GET",
      "Request received with params: " + JSON.stringify(requestParams)
    );
    var user = runtime.getCurrentUser();
    return {
      success: true,
      message: "Restlet get response",
      timestamp: new Date().toISOString(),
      method: "GET",
      requestParams: requestParams,
      userInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  function doPost(requestBody) {
    logCollector.clear();
    folderIdCache = Object.create(null);
    customFolder = requestBody.customFolder || null;

    // Validate account ID if provided in the request
    var accountValidationError = validateAccountId(requestBody.expectedAccountId);
    if (accountValidationError) {
      return accountValidationError;
    }

    var action = requestBody.action;

    // Resolve root folders once for this request. Supports both the legacy
    // single-folder shape (suiteScriptsFolder: string) and the multi-root
    // shape (rootFolders: string[]). Missing folders are reported but don't
    // abort the request unless no folders resolve at all.
    const { resolved: rootFolders, missing: missingRoots } =
      resolveRootFolders(requestBody);

    if (missingRoots.length) {
      logger.audit(
        "Missing root folders",
        `Configured but not found: ${missingRoots.join(", ")}`
      );
    }

    if (!rootFolders.length) {
      return {
        success: false,
        message:
          `No configured root folders found in File Cabinet: ${missingRoots.join(", ")}`,
        missingRoots: missingRoots,
        logs: logCollector.get(),
      };
    }

    try {
      let result;
      switch (action) {
        case "syncNetsuiteCabinet":
          result = syncNetsuiteCabinet(
            requestBody.filesToUpload,
            requestBody.filesToDelete,
            rootFolders
          );
          break;
        case "getAllFiles":
          result = getAllFiles(
            requestBody.lastPath,
            requestBody.searchFilters,
            requestBody.ignoredPaths,
            rootFolders
          );
          break;
        case "fetchFiles":
          // rootFolders intentionally omitted: fetchFiles resolves paths by
          // name-based traversal, so the scope list would be unused here.
          result = fetchFiles(requestBody.filesToFetch);
          break;
        case "checkSyncStatus":
          result = checkSyncStatus(
            requestBody.lastSyncDate,
            requestBody.stage,
            requestBody.searchFilters,
            requestBody.ignoredPaths,
            rootFolders
          );
          break;
        case "checkFilesExistence":
          // rootFolders intentionally omitted: checkFilesExistence traverses
          // each path by name, so scope list is not consulted.
          result = checkFilesExistence(requestBody.paths);
          break;

        default:
          var user = runtime.getCurrentUser();
          result = {
            success: true,
            message: "RESTlet POST response",
            timestamp: new Date().toISOString(),
            method: "POST",
            receivedData: requestBody,
            userInfo: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
            echoData: requestBody,
          };
      }

      result.logs = logCollector.get();

      return result;
    } catch (e) {
      logger.error("RESTlet Error", e.toString());
      return {
        success: false,
        error: createErrorObject(e, null, null, {
          action: requestBody.action,
          context: "RESTlet main handler",
        }),
        message: e.message || "An error occurred",
        logs: logCollector.get(), // Always include logs on errors
      };
    }
  }

  /******************************* Get All files *******************************/
  function getAllFiles(
    lastPath = null,
    searchFilters,
    ignoredPaths,
    rootFolders = []
  ) {
    const startTime = Date.now();
    const startTimeUTC = new Date(startTime).toISOString();
    const rootNames = rootFolders.map((r) => r.name).join(", ");

    logger.audit(
      "Start getAllFiles",
      `Start time (UTC): ${startTimeUTC} | Resume from: ${
        lastPath || "START"
      } | Roots: ${rootNames}`
    );

    try {
      const allFiles = { fetched: [], errors: [], resumePath: null };

      // When resuming, the lastPath's first segment tells us which root to
      // resume within. Roots before it are already complete; roots after it
      // haven't started yet.
      const resumeRootName = lastPath ? lastPath.split("/")[0] : null;
      let skipUntilResume = !!resumeRootName;

      for (const root of rootFolders) {
        if (allFiles.resumePath) break;

        if (skipUntilResume) {
          if (root.name !== resumeRootName) continue;
          skipUntilResume = false;
        }

        const files = getFilesInFolderRecursive(
          root.id,
          `${root.name}/`,
          // Only pass lastPath to the root it belongs to — other roots
          // start from the beginning.
          root.name === resumeRootName ? lastPath : null,
          searchFilters,
          ignoredPaths
        );

        allFiles.fetched.push(...files.fetched);
        allFiles.errors.push(...files.errors);

        if (files.resumePath) {
          allFiles.resumePath = files.resumePath;
        }
      }

      logger.audit(
        "Files Found",
        `${allFiles.fetched.length} total files in this batch`
      );

      let resumePath = allFiles.resumePath;

      const executionTime = Date.now() - startTime;
      logger.audit(
        "Done getAllFiles",
        `${allFiles.fetched.length} files fetched | Start time (UTC): ${startTimeUTC} | Execution time: ${executionTime}ms`
      );

      return {
        success: true,
        fetched: allFiles.fetched,
        errors: allFiles.errors,
        syncDate: startTimeUTC,
        lastPath: resumePath,
        isComplete: !resumePath,
        executionTime,
      };
    } catch (err) {
      logger.error("getAllFiles Critical Error", err.message);
      return {
        success: false,
        error: createErrorObject(err, null, null, {
          context: "getAllFiles main logic",
        }),
        fetched: [],
        errors: [],
        syncDate: startTimeUTC,
        lastPath: lastPath,
        isComplete: false,
        executionTime: Date.now() - startTime,
      };
    }
  }
  /******************************** End Get All files ********************************/

  /******************************** Start fetchFiles from list ********************************/
  function fetchFiles(filesToFetch = []) {
    const startTime = Date.now();
    const startTimeUTC = new Date(startTime).toISOString();

    logger.audit(
      "Start fetchFiles",
      `fetchFiles Start time (UTC): ${startTimeUTC}`,
    );

    const fetched = [];
    const errors = [];
    const logs = [];

    if (!Array.isArray(filesToFetch) || filesToFetch.length === 0) {
      const executionTime = Date.now() - startTime;
      return {
        success: true,
        fetched,
        errors,
        logs,
        lastPath: null,
        isComplete: true,
        executionTime,
      };
    }

    for (const path of filesToFetch) {
      try {
        const fileObj = getPathContent64(path);
        fetched.push({ path, content: fileObj.base64Content });

        const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        if (remainingUsage < BATCH_USAGE_THRESHOLD) {
          const executionTime = Date.now() - startTime;
          logger.debug(
            "Batch limit reached",
            `Remaining Usage: ${remainingUsage}, Last Path: ${path}, processed files: ${fetched.length}`
          );
          return {
            success: true,
            fetched,
            errors,
            logs,
            lastPath: path,
            isComplete: false,
            executionTime,
          };
        }
      } catch (err) {
        const fileName = path.split("/").pop();
        errors.push(createErrorObject(err, path, fileName));
        logger.error("fetchFiles Error", `${path}: ${err.message}`);
      }
    }

    const executionTime = Date.now() - startTime;
    logger.audit(
      "Done fetchFiles",
      `${fetched.length} files fetched | Start time (UTC): ${startTimeUTC} | Execution time: ${executionTime}ms`
    );

    return {
      success: true,
      fetched,
      errors,
      logs,
      lastPath: null,
      isComplete: true,
      executionTime,
    };
  }
  /******************************** End fetchFiles ********************************/

  /******************************* Check Files Existence *******************************/
  /**
   * Checks if files exist in NetSuite file cabinet
   * @param {string[]} filePaths - Array of file paths to check (e.g., ["SuiteScripts/file.js", "TestScripts/folder/file.txt"])
   * @returns {Object} - Object containing deleted file paths and execution stats
   */
  function checkFilesExistence(filePaths = []) {
    const startTime = Date.now();
    const startTimeUTC = new Date(startTime).toISOString();

    logger.audit(
      "Start checkFilesExistence",
      `Checking ${filePaths.length} file paths | Start time (UTC): ${startTimeUTC}`,
    );
    logger.debug("filePaths", filePaths);

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return {
        success: true,
        deletedFiles: [],
        errors: [],
        executionTime: Date.now() - startTime,
      };
    }

    const deletedFiles = [];
    const errors = [];

    for (const filePath of filePaths) {
      try {
        // Check governance units
        const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        if (remainingUsage < BATCH_USAGE_THRESHOLD) {
          logger.audit(
            "Governance limit approaching",
            `Remaining: ${remainingUsage}`
          );
          break;
        }

        // Parse the file path
        const parts = (filePath || "").split("/").filter(Boolean);
        const fileName = parts.pop();

        if (!fileName) {
          errors.push(
            createErrorObject(new Error("Invalid file path"), filePath, null, {
              reason: "Empty or invalid file name",
            })
          );
          continue;
        }

        // Get the folder ID for the parent folder path
        const folderPath = parts.join("/");
        const parentFolderId = folderPath
          ? getFolderIdByPath(folderPath)
          : null;

        // If folder doesn't exist, file is deleted
        if (folderPath && !parentFolderId) {
          deletedFiles.push(filePath);
          continue;
        }

        // Use folder search with file join to check if file exists
        // This is more efficient than searching files directly
        const folderSearch = search.create({
          type: search.Type.FOLDER,
          filters: [
            parentFolderId
              ? ["internalid", "is", parentFolderId]
              : ["internalid", "isempty", ""],
            "AND",
            ["file.name", "is", fileName],
          ],
          columns: [
            search.createColumn({ name: "internalid", join: "file" }),
            search.createColumn({ name: "name", join: "file" }),
          ],
        });

        let fileFound = false;
        folderSearch.run().each(function (result) {
          const fileId = result.getValue({ name: "internalid", join: "file" });
          if (fileId) {
            fileFound = true;
            return false; // Stop after finding the file
          }
          return true;
        });

        if (!fileFound) {
          deletedFiles.push(filePath);
        }
      } catch (err) {
        const fileName = filePath.split("/").pop();
        errors.push(createErrorObject(err, filePath, fileName));
        logger.error(
          "checkFilesExistence Error",
          `${filePath}: ${err.message}`
        );
      }
    }

    const executionTime = Date.now() - startTime;
    logger.audit(
      "Done checkFilesExistence",
      `Deleted: ${deletedFiles.length}, Errors: ${errors.length} | Execution time: ${executionTime}ms`
    );

    return {
      success: true,
      deletedFiles,
      errors,
      executionTime,
    };
  }
  /******************************** End Check Files Existence ********************************/

  /******************************* Sync check by date *******************************/
  function checkSyncStatus(
    lastSyncDate,
    stage = 0,
    searchFilters,
    ignoredPaths,
    rootFolders = []
  ) {
    const startTime = Date.now();
    const startTimeUTC = new Date(startTime).toISOString();
    const rootNames = rootFolders.map((r) => r.name).join(", ");
    logger.audit(
      "Start checkSyncStatus",
      `Comparing NetSuite files, modified since: ${lastSyncDate} | Stage: ${stage} | Start time (UTC): ${startTimeUTC} | Roots: ${rootNames}`
    );

    // Prepare date filters in both formats:
    // 1. filterDateString: Date-only string for NetSuite search filters (e.g., "1/20/2026")
    // 2. filterDateUTC: Full Date object for precise UTC comparisons
    let filterDateString = null;
    let filterDateUTC = null;

    if (lastSyncDate) {
      // Convert ISO string to Date object for precise comparisons
      filterDateUTC = new Date(lastSyncDate);
      // Convert to NetSuite server date string for search filters
      filterDateString = parseUTCToServerDate(lastSyncDate);
    }

    let deleted = [];
    let modified = [];
    const errors = [];
    let currentStage = stage;
    let resumeFromDate = null;
    let isComplete = false;

    // Step 1: Find deleted files on netsuite (deleted files)
    if (currentStage === 0) {
      try {
        const deletedAfterDate = findDeletedFiles(
          filterDateString,
          filterDateUTC,
          searchFilters,
          ignoredPaths,
          rootFolders,
        );
        deleted = deletedAfterDate.deleted;
        errors.push(...deletedAfterDate.errors);

        // Check if we need to stop due to governance
        const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        if (remainingUsage < BATCH_USAGE_THRESHOLD) {
          logger.debug(
            "Batch limit reached in stage 0",
            `Remaining Usage: ${remainingUsage}, Deleted files found: ${deleted.length}`
          );
          const executionTime = Date.now() - startTime;
          return {
            success: true,
            modified: [],
            deleted,
            errors,
            startTimeUTC,
            executionTime,
            stage: currentStage,
            resumePath: null,
            isComplete: false,
          };
        }

        // Stage 0 complete, move to stage 1
        currentStage = 1;
        logger.debug(
          "Stage 0 complete",
          `Deleted files found: ${deleted.length}`
        );
      } catch (err) {
        logger.error("findDeletedFiles Error", err.message);
        errors.push(
          createErrorObject(err, null, null, {
            stage: "findDeletedFiles",
            context: "checkSyncStatus stage 0",
          })
        );
      }
    }

    // Step 2: Get files modified after the date (with content) for comparison
    if (currentStage === 1) {
      try {
        const modifiedAfterDate = getFilesModifiedAfterUTC(
          filterDateString,
          filterDateUTC,
          searchFilters,
          ignoredPaths,
          rootFolders,
        );

        modified = modifiedAfterDate.files;
        errors.push(...modifiedAfterDate.errors);

        // Check if getFilesModifiedAfterUTC returned a resumeFromDate (partial results)
        if (modifiedAfterDate.resumeFromDate) {
          resumeFromDate = modifiedAfterDate.resumeFromDate;
          isComplete = false;
          logger.debug(
            "Batch limit reached in stage 1",
            `Modified files processed: ${modified.length}, Resume from: ${resumeFromDate}`
          );
        } else {
          // Stage 1 complete
          isComplete = true;
          currentStage = 2;
          logger.debug(
            "Stage 1 complete",
            `Modified files found: ${modified.length}`
          );
        }
      } catch (err) {
        logger.error("getFilesModifiedAfterUTC Error", err.message);
        errors.push(
          createErrorObject(err, null, null, {
            stage: "getFilesModifiedAfterUTC",
            context: "checkSyncStatus stage 1",
          })
        );
      }
    }

    const executionTime = Date.now() - startTime;

    logger.audit(
      isComplete ? "Comparison Complete" : "Batch Complete (Partial)",
      `Modified: ${modified.length}, Deleted: ${
        deleted.length
      } | Stage: ${currentStage} | Execution time: ${executionTime}ms (${(
        executionTime / 1000
      ).toFixed(2)}s)`
    );

    return {
      success: true,
      modified,
      deleted,
      errors,
      startTimeUTC,
      executionTime,
      stage: currentStage,
      resumeFromDate,
      isComplete,
    };
  }
  /******************************** End Sync check by date  ********************************/

  /******************************** Upload commit files to netsuite *************************/
  function syncNetsuiteCabinet(filesToUpload, filesToDelete, rootFolders) {
    const startTime = Date.now();
    const rootNames = (rootFolders || []).map((r) => r.name).join(", ");
    logger.audit(
      "Start syncNetsuiteCabinet",
      `Files to upload: ${filesToUpload.length}, Files to delete: ${filesToDelete.length} | Roots: ${rootNames}`,
    );

    // Paths from the backend are now File Cabinet-relative (e.g.
    // "SuiteScripts/Cycle/foo.js"). The first segment must match one of the
    // configured root folders; anything else is rejected as out-of-scope.
    const allowedRoots = new Set((rootFolders || []).map((r) => r.name));
    // Cycle-internal files that live in the repo only and must never be
    // round-tripped to NetSuite. Kept in sync with modules/shared's
    // CYCLE_INTERNAL_FILES list.
    const CYCLE_INTERNAL_FILES = [".cycleignore"];
    function isCycleInternal(fcRelativePath) {
      var normalized = (fcRelativePath || "").replace(/^\/+/, "");
      for (var i = 0; i < CYCLE_INTERNAL_FILES.length; i++) {
        if (CYCLE_INTERNAL_FILES[i] === normalized) return true;
      }
      return false;
    }
    function isWithinAllowedRoots(fcRelativePath) {
      if (isCycleInternal(fcRelativePath)) return false;
      const top = (fcRelativePath || "").split("/")[0];
      return allowedRoots.has(top);
    }
    let errors = [];
    let results = []; // Track successfully processed files

    //Create folder path recursively if it doesn't exist. Returns the internal ID of the deepest folder.
    function ensureFolderPath(fullPath) {
      try {
        const parts = fullPath.split("/").filter(Boolean);
        let parentId = null;

        for (const name of parts) {
          const filters = [["name", "is", name]];

          if (parentId) {
            filters.push("AND", ["parent", "anyof", parentId]);
          } else {
            filters.push("AND", ["istoplevel", "is", "T"]);
          }

          const existing = search
            .create({
              type: "folder",
              filters: filters,
              columns: ["internalid"],
            })
            .run()
            .getRange({ start: 0, end: 1 });

          if (existing && existing.length) {
            parentId = existing[0].getValue({ name: "internalid" });
          } else {
            const newFolder = record.create({
              type: record.Type.FOLDER,
            });
            newFolder.setValue({ fieldId: "name", value: name });
            newFolder.setValue({ fieldId: "parent", value: parentId });
            parentId = newFolder.save();
          }
        }
        return parentId;
      } catch (err) {
        // Re-throw with context
        const enhancedError = new Error(
          `Failed to ensure folder path: ${err.message}`
        );
        enhancedError.name = err.name;
        enhancedError.code = err.code;
        enhancedError.stack = err.stack;
        enhancedError.folderPath = fullPath;
        throw enhancedError;
      }
    }

    /**
     * Checks if a folder is empty (no files and no subfolders) and deletes it recursively if empty.
     */
    function deleteFolderIfEmpty(folderId) {
      if (!folderId) return;

      // Don't delete File Cabinet system folders (negative IDs)
      if (folderId < 0) {
        logger.debug("Skipping system folder deletion", { folderId });
        return;
      }

      try {
        // Check if folder has any files
        const fileCheck = search.create({
          type: search.Type.FOLDER,
          filters: [["internalid", "is", folderId]],
          columns: [search.createColumn({ name: "internalid", join: "file" })],
        });

        let hasFiles = false;
        fileCheck.run().each(function (result) {
          const fileId = result.getValue({
            name: "internalid",
            join: "file",
          });
          if (fileId) {
            hasFiles = true;
            return false; // Stop searching
          }
          return true;
        });

        if (hasFiles) {
          logger.debug("Folder has files, not deleting", { folderId });
          return;
        }

        // Check if folder has any subfolders
        const subfolderCheck = search.create({
          type: "folder",
          filters: [["parent", "anyof", folderId]],
          columns: ["internalid"],
        });

        const subfolders = subfolderCheck.run().getRange({ start: 0, end: 1 });
        if (subfolders && subfolders.length > 0) {
          logger.debug("Folder has subfolders, not deleting", { folderId });
          return;
        }

        // Folder is empty, get parent before deleting
        const folderRec = record.load({
          type: "folder",
          id: folderId,
        });
        const folderName = folderRec.getValue({ fieldId: "name" });
        const parentId = folderRec.getValue({ fieldId: "parent" });

        // Delete the empty folder
        record.delete({
          type: "folder",
          id: folderId,
        });
        logger.debug("Deleted empty folder", { folderId, folderName });

        // Recursively check parent folder
        if (parentId) {
          deleteFolderIfEmpty(parentId);
        }
      } catch (err) {
        logger.error("Error in deleteFolderIfEmpty", {
          folderId,
          error: err.message,
          stack: err.stack,
        });
      }
    }

    // ----------------- Upload / overwrite files -----------------
    for (const { path, contentBase64, fileType, operation } of filesToUpload) {
      let fullPath;
      try {
        // Paths from the backend are File Cabinet-relative
        // (e.g. "SuiteScripts/Cycle/foo.js"). Reject anything outside the
        // configured root folders to prevent writes to unrelated areas.
        if (!isWithinAllowedRoots(path)) {
          throw new Error(
            `Path "${path}" is outside the configured root folders (${rootNames})`,
          );
        }

        fullPath = path;
        logger.debug("Uploading path", fullPath);

        if (!path || !contentBase64) continue;

        const parts = fullPath.split("/");
        const fileName = parts.pop();
        const folderPath = parts.join("/");

        logger.debug(
          "Upload details",
          `fileName: ${fileName}, folderPath: ${folderPath}`
        );

        const folderId = folderPath ? ensureFolderPath(folderPath) : null;

        logger.debug(
          "Resolved folderId",
          `folderId: ${folderId} for path: ${folderPath}`
        );

        const fileOptions = {
          name: fileName,
          fileType,
          contents: contentBase64,
          folder: folderId,
        };

        // Create file with Base64-encoded contents
        const fileObj = file.create(fileOptions);

        const id = fileObj.save();
        logger.debug(
          "Uploaded file",
          JSON.stringify({ fileName, fileId: id, folderId })
        );

        // Track successful upload (use fullPath to match error format)
        results.push({ path: fullPath, status: "success" });
      } catch (err) {
        const fileName = path ? path.split("/").pop() : null;
        errors.push(
          createErrorObject(err, fullPath || path, fileName, {
            operation: operation || "MODIFY", // Use provided operation or default to MODIFY
            fileType: fileType,
          })
        );
        logger.error("Error uploading file", {
          fullPath: fullPath || path,
          error: err.message,
        });
      }
    }

    // ----------------- Delete files -----------------
    for (const path of filesToDelete) {
      // Paths from the backend are File Cabinet-relative.
      if (!isWithinAllowedRoots(path)) {
        logger.debug("Skipping delete - path outside allowed roots", path);
        continue;
      }
      const fullPath = path;
      logger.debug("Deleting path", fullPath);

      const parts = fullPath.split("/");
      const fileName = parts.pop();
      const folderPath = parts.join("/");

      const folderId = folderPath ? getFolderIdByPath(folderPath) : null;

      if (!folderId && folderPath) {
        logger.debug("Folder not found, skipping delete", { path, folderPath });
        continue;
      }

      try {
        // Use folder search with file join to get only files in this exact folder
        const folderSearch = search.create({
          type: search.Type.FOLDER,
          filters: [
            ["internalid", "is", folderId],
            "AND",
            ["file.name", "is", fileName],
          ],
          columns: [
            search.createColumn({ name: "internalid", join: "file" }),
            search.createColumn({ name: "name", join: "file" }),
          ],
        });

        let fileDeleted = false;
        folderSearch.run().each(function (result) {
          const fileId = result.getValue({
            name: "internalid",
            join: "file",
          });

          if (fileId) {
            file.delete({ id: fileId });
            logger.debug("Deleted file", { path, fileId });
            fileDeleted = true;

            // Track successful deletion (use fullPath to match error format)
            results.push({ path: fullPath, status: "success" });
          }
          return true; // Continue processing if multiple files found
        });

        if (!fileDeleted) {
          // File not found means it's already deleted - this is success
          logger.debug("File not found for deletion (already deleted)", {
            path,
            fileName,
            folderId,
          });
          results.push({ path: fullPath, status: "success" });
        } else if (folderId) {
          // Check if folder is now empty and delete it (and parent folders) if so
          deleteFolderIfEmpty(folderId);
        }
      } catch (err) {
        const fileName = path.split("/").pop();
        errors.push(
          createErrorObject(err, fullPath, fileName, {
            operation: "DELETE",
            folderId: folderId,
          })
        );
        logger.error("Error deleting file", { fullPath, error: err.message });
      }
    }

    const executionTime = Date.now() - startTime;
    logger.audit(
      "Done syncNetsuiteCabinet",
      `Files processed: ${results.length} successful, ${
        errors.length
      } errors | Execution time: ${executionTime}ms (${(
        executionTime / 1000
      ).toFixed(2)}s)`
    );

    return {
      success: true,
      executionTime,
      results, // Return successfully processed files
      errors,
    };
  }

  /******************************** END Upload commit files to netsuite *************************/

  function getFilesModifiedAfterUTC(
    filterDateString,
    filterDateUTC,
    searchFilters,
    ignoredPaths,
    rootFolders = [],
  ) {
    const results = [];
    const errors = [];
    const folderPathCache = {}; // Cache folder paths to avoid repeated record.load calls
    const rootIdSet = new Set();

    if (!rootFolders.length) {
      return {
        files: [],
        errors: [{ message: "No root folders configured", path: "" }],
        resumeFromDate: null,
      };
    }

    // Prepopulate cache with the resolved roots so folder-chain traversal
    // terminates at a known top-level folder name.
    for (const root of rootFolders) {
      folderPathCache[root.id] = root.name;
      rootIdSet.add(Number(root.id));
    }

    // 1. Search files modified on or after the date
    // Note: NetSuite search filters only accept date strings (not datetime)
    // We do precise UTC datetime comparison in the loop below.
    //
    // "folder anyof" with multiple IDs scopes the search to files directly in
    // those folders OR any of their subfolders, matching File Cabinet semantics.
    const filters = [["folder", "anyof", rootFolders.map((r) => r.id)]];
    if (filterDateString) {
      filters.push("AND", ["modified", "onorafter", filterDateString]);
    }

    if (searchFilters && searchFilters.length > 0) {
      filters.push("AND", searchFilters);
    }

    const fileSearch = search.create({
      type: "file",
      filters,
      columns: [
        search.createColumn({
          name: "modified",
          sort: search.Sort.ASC,
        }),
        "internalid",
        "name",
        "folder",
      ],
    });

    const filePagedData = fileSearch.runPaged({ pageSize: 1000 });

    let lastModifiedUTC = null; // Track the last processed file's modified date for resumption

    for (const pageRange of filePagedData.pageRanges) {
      const page = filePagedData.fetch({ index: pageRange.index });

      for (const result of page.data) {
        try {
          const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
          if (remainingUsage < BATCH_USAGE_THRESHOLD) {
            // Stop and return partial results with the last modified date (in UTC) for resumption
            logger.debug(
              "Batch limit reached",
              `Remaining Usage: ${remainingUsage}, Last Modified (UTC): ${
                lastModifiedUTC ? lastModifiedUTC.toISOString() : "N/A"
              }, processed files: ${results.length}`
            );
            return {
              files: results,
              errors,
              resumeFromDate: lastModifiedUTC
                ? lastModifiedUTC.toISOString()
                : null,
            };
          }

          const fileId = result.getValue({ name: "internalid" });
          const fileName = result.getValue({ name: "name" });
          const folderId = result.getValue({ name: "folder" });
          const modifiedStr = result.getValue({ name: "modified" });

          if (!fileId || !fileName || !folderId || !modifiedStr) continue;

          const modifiedUTC = parseNetSuiteDateToUTC(modifiedStr);

          // Filter precisely by UTC - only include files modified on or after the filter date
          if (filterDateUTC && modifiedUTC < filterDateUTC) continue;
          // 2. Build full path by traversing parent folders (with caching)
          let fullPath = fileName;
          let currentFolderId = folderId;

          // Check if we have this folder path cached
          if (folderPathCache[folderId]) {
            fullPath = folderPathCache[folderId] + "/" + fileName;
          } else {
            // Build the path and cache all folders in the chain
            const folderChain = [];
            let cachedParentPath = null;

            while (currentFolderId) {
              // Check if this folder is already cached
              if (folderPathCache[currentFolderId]) {
                cachedParentPath = folderPathCache[currentFolderId];
                fullPath = cachedParentPath + "/" + fullPath;
                break;
              }

              const folderRec = record.load({
                type: "folder",
                id: currentFolderId,
              });
              const folderName = folderRec.getValue({ fieldId: "name" });
              const parentId = folderRec.getValue({ fieldId: "parent" });

              folderChain.push({
                id: currentFolderId,
                name: folderName,
                parentId,
              });
              fullPath = folderName + "/" + fullPath;
              currentFolderId = parentId;
            }

            // Cache all folders in the chain we just traversed
            // Start from the cached parent path (if found) or empty string
            let pathSoFar = cachedParentPath || "";
            for (let i = folderChain.length - 1; i >= 0; i--) {
              pathSoFar = pathSoFar
                ? pathSoFar + "/" + folderChain[i].name
                : folderChain[i].name;
              folderPathCache[folderChain[i].id] = pathSoFar;
            }
          }
          // Paths are File Cabinet-relative (e.g. "SuiteScripts/Cycle/foo.js").
          // .cycleignore patterns match against the full path, so no prefix
          // stripping is needed.
          if (shouldIgnorePath(toRepoPath(fullPath, customFolder), ignoredPaths)) continue;
          logger.debug("fullPath", fullPath);

          // Get base64 content
          const content = getFileContent64(fileId);
          results.push({
            id: fileId,
            name: fileName,
            path: fullPath,
            content,
            modified: modifiedUTC.toISOString(),
          });

          // Track the last modified date (in UTC) for resumption
          lastModifiedUTC = modifiedUTC;
        } catch (err) {
          const fileId = result.getValue({ name: "internalid" });
          const fileName = result.getValue({ name: "name" });
          // We may not have fullPath yet if error occurred during path construction
          const partialPath = fileName || "unknown";
          errors.push(
            createErrorObject(err, partialPath, fileName, {
              fileId: fileId,
              context: "getFilesModifiedAfterUTC file processing",
            })
          );
          logger.error(`File ${fileId} Processing Error`, err.message);
        }
      }
    }

    // Return results without resumeFromDate if we completed all files
    return { files: results, errors, resumeFromDate: null };
  }

  function findDeletedFiles(
    filterDateString,
    filterDateUTC,
    searchFilters,
    ignoredPaths,
    rootFolders,
  ) {
    // Note: rootFolders is accepted for API-signature consistency with other
    // multi-root functions, but NetSuite's deletedrecord search can't scope
    // by folder (the parent folder info is gone once the file is deleted).
    // We rely on .cycleignore filename patterns to filter out noise.
    void rootFolders;
    const deleted = [];
    const errors = [];
    if (!filterDateString || !filterDateUTC) {
      return { deleted, errors };
    }

    const filters = [
      ["recordtype", "anyof", "file"],
      "AND",
      ["deleteddate", "onorafter", filterDateString],
    ];

    if (searchFilters && searchFilters.length > 0) {
      filters.push("AND", searchFilters);
    }
    const deletedSearch = search.create({
      type: "deletedrecord",
      filters,
      columns: [
        search.createColumn({
          name: "name",
          summary: search.Summary.GROUP,
        }),
        search.createColumn({
          name: "deleteddate",
          summary: search.Summary.MAX,
        }),
        search.createColumn({
          name: "deletedby",
          summary: search.Summary.GROUP,
        }),
      ],
    });

    const pagedData = deletedSearch.runPaged({ pageSize: 1000 });

    for (const pageRange of pagedData.pageRanges) {
      const page = pagedData.fetch({ index: pageRange.index });

      for (const result of page.data) {
        try {
          const fileName = result.getValue({
            name: "name",
            summary: search.Summary.GROUP,
          });
          const deletedDateStr = result.getValue({
            name: "deleteddate",
            summary: search.Summary.MAX,
          });
          const deletedBy = result.getText({
            name: "deletedby",
            summary: search.Summary.GROUP,
          });

          // For deleted records we only have the filename, not the full
          // path. The full shouldIgnorePath algorithm can't work correctly
          // here because path-based patterns (like "/*" + "!/Folder/**")
          // need the directory context to evaluate negations. We only apply
          // simple filename-only extension filters (e.g. "*.pdf", "*.log")
          // that don't involve negations or path segments.
          if (shouldIgnoreFileName(fileName, ignoredPaths)) {
            continue;
          }

          const deletedUTC = parseNetSuiteDateToUTC(deletedDateStr);

          // Filter precisely by UTC - only include files deleted on or after the filter date
          if (deletedUTC < filterDateUTC) continue;

          logger.debug(
            "Deleted file",
            fileName + " at " + deletedUTC.toISOString() + " by " + (deletedBy || "unknown")
          );

          deleted.push({
            name: fileName,
            modified: deletedUTC.toISOString(),
            lastModifiedBy: deletedBy || undefined,
          });
        } catch (err) {
          const fileName = result.getValue({ name: "name" });
          errors.push(
            createErrorObject(err, null, fileName, {
              context: "findDeletedFiles deleted record processing",
            })
          );
        }
      }
    }

    return { deleted, errors };
  }

  function getFilesInFolderRecursive(
    folderId,
    prefix = "",
    lastPath = null,
    searchFilters,
    ignoredPaths,
    resumeFound = false
  ) {
    let fetched = [];
    let errors = [];

    // 1️⃣ Get files directly in this folder using folder join (paged)
    const filters = [["internalid", "is", folderId]];
    if (searchFilters && searchFilters.length > 0) {
      filters.push("AND", searchFilters);
    }
    const fileFolderSearch = search.create({
      type: search.Type.FOLDER,
      filters,
      columns: [
        search.createColumn({ name: "internalid", join: "file" }),
        search.createColumn({ name: "name", join: "file" }),
        search.createColumn({ name: "filetype", join: "file" }),
      ],
    });

    const filePagedData = fileFolderSearch.runPaged({ pageSize: 1000 });
    for (const pageRange of filePagedData.pageRanges) {
      const page = filePagedData.fetch({ index: pageRange.index });
      for (const result of page.data) {
        const fileId = result.getValue({ name: "internalid", join: "file" });
        const fileName = result.getValue({ name: "name", join: "file" });
        const fileType = result.getValue({ name: "filetype", join: "file" });

        if (fileId && fileName) {
          const path = prefix + fileName;

          // Handle resume: skip files until we find the last processed path
          if (!resumeFound && lastPath) {
            if (path === lastPath) {
              resumeFound = true; // start processing from next file
            }
            continue;
          }

          try {
            if (shouldIgnorePath(toRepoPath(path, customFolder), ignoredPaths)) continue;

            let content = getFileContent64(fileId);

            fetched.push({ name: fileName, path, content });

            const remainingUsage = runtime
              .getCurrentScript()
              .getRemainingUsage();
            if (remainingUsage < BATCH_USAGE_THRESHOLD) {
              // Stop and return partial results
              logger.debug(
                "Batch limit reached",
                `Remaining Usage: ${remainingUsage}, Last Path: ${path}, processed files: ${fetched.length}`
              );
              return { fetched, errors, resumePath: path, resumeFound: true };
            }
          } catch (err) {
            const fileName = path ? path.split("/").pop() : null;
            errors.push(
              createErrorObject(err, path, fileName, {
                fileId: fileId,
                context: "getFilesInFolderRecursive file loading",
              })
            );
            logger.error(
              "Load Error",
              `Error loading file in ${prefix}: ${err.message}`
            );
          }
        }
      }
    }

    // 2️⃣ Recurse into subfolders (paged)
    const folderSearch = search.create({
      type: "folder",
      filters: [["parent", "anyof", folderId]],
      columns: ["internalid", "name"],
    });

    const folderPagedData = folderSearch.runPaged({ pageSize: 1000 });
    for (const pageRange of folderPagedData.pageRanges) {
      const page = folderPagedData.fetch({ index: pageRange.index });
      for (const sub of page.data) {
        const subId = sub.getValue({ name: "internalid" });
        const subName = sub.getValue({ name: "name" });

        const subFiles = getFilesInFolderRecursive(
          subId,
          prefix + subName + "/",
          lastPath,
          searchFilters,
          ignoredPaths,
          resumeFound
        );

        fetched.push(...subFiles.fetched);
        errors.push(...subFiles.errors);

        // If sub recursion returned a resumePath, stop and bubble up
        if (subFiles.resumePath) {
          return {
            fetched,
            errors,
            resumePath: subFiles.resumePath,
            resumeFound: true,
          };
        }

        // Update resumeFound flag after returning from subfolders
        if (subFiles.resumeFound) resumeFound = true;
      }
    }

    return { fetched, errors, resumePath: null, resumeFound };
  }

  function getFileContent64(fileId) {
    try {
      const f = file.load({ id: fileId });
      let base64Content;

      if (f.isText) {
        base64Content = encode.convert({
          string: f.getContents(),
          inputEncoding: encode.Encoding.UTF_8,
          outputEncoding: encode.Encoding.BASE_64,
        });
      } else {
        base64Content = f.getContents(); // Already base64 for binaries
      }
      return base64Content;
    } catch (err) {
      // Re-throw with additional context
      const enhancedError = new Error(err.message);
      enhancedError.name = err.name;
      enhancedError.code = err.code;
      enhancedError.stack = err.stack;
      enhancedError.fileId = fileId;
      throw enhancedError;
    }
  }

  function getPathContent64(filePath) {
    try {
      // Paths are File Cabinet-absolute (e.g. "SuiteScripts/Cycle/foo.js").
      // The first segment must be a top-level File Cabinet folder. We resolve
      // it by name (via getFolderIdByPath, which restricts to istoplevel=T)
      // and then walk the rest of the path segment by segment.
      const parts = (filePath || "").split("/").filter(Boolean);
      const fileName = parts.pop();
      if (!fileName) throw new Error("Invalid file path");

      const topLevelName = parts.shift();
      if (!topLevelName) {
        throw new Error(
          `Invalid file path: "${filePath}" (missing top-level folder)`,
        );
      }

      // Walk the folder chain, consulting `folderIdCache` at each step. For a
      // batch of files sharing a prefix (e.g. SuiteScripts/A/B/*.js), only the
      // first file pays the full traversal cost; subsequent files hit cache.
      let cumulativePath = topLevelName;
      let parentFolderId = folderIdCache[cumulativePath];
      if (!parentFolderId) {
        parentFolderId = getFolderIdByPath(topLevelName);
        if (!parentFolderId) {
          throw new Error(`Top-level folder not found: "${topLevelName}"`);
        }
        folderIdCache[cumulativePath] = parentFolderId;
      }

      for (let i = 0; i < parts.length; i++) {
        const folderName = parts[i];
        cumulativePath = cumulativePath + "/" + folderName;

        const cachedId = folderIdCache[cumulativePath];
        if (cachedId) {
          parentFolderId = cachedId;
          continue;
        }

        const results = search
          .create({
            type: "folder",
            filters: [
              ["name", "is", folderName],
              "AND",
              ["parent", "anyof", parentFolderId],
            ],
            columns: ["internalid"],
          })
          .run()
          .getRange({ start: 0, end: 1 });

        if (!results || results.length === 0) {
          throw new Error(
            `Folder not found in path: ${topLevelName}/${parts
              .slice(0, i + 1)
              .join("/")}`,
          );
        }

        parentFolderId = results[0].getValue({ name: "internalid" });
        folderIdCache[cumulativePath] = parentFolderId;
      }

      // Find the file in the final folder
      const fileResults = search
        .create({
          type: "file",
          filters: [
            ["name", "is", fileName],
            "AND",
            ["folder", "anyof", parentFolderId],
          ],
          columns: ["internalid"],
        })
        .run()
        .getRange({ start: 0, end: 1 });

      if (!fileResults || fileResults.length === 0) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileId = fileResults[0].getValue({ name: "internalid" });

      const base64Content = getFileContent64(fileId);

      return { name: filePath, base64Content };
    } catch (err) {
      // Re-throw with additional context
      const fileName = filePath ? filePath.split("/").pop() : null;
      const enhancedError = new Error(err.message);
      enhancedError.name = err.name;
      enhancedError.code = err.code;
      enhancedError.stack = err.stack;
      enhancedError.filePath = filePath;
      enhancedError.fileName = fileName;
      throw enhancedError;
    }
  }

  /**
   * Convert a File Cabinet-relative path to repo-relative by stripping the
   * custom folder prefix. No-op when customFolder is null (multi-root mode).
   * Used before shouldIgnorePath so .cycleignore patterns (written
   * repo-relative) match correctly for custom-folder envs.
   */
  function toRepoPath(fcPath, folder) {
    if (!folder) return fcPath;
    const prefix = folder + "/";
    if (fcPath.indexOf(prefix) === 0) {
      return fcPath.slice(prefix.length);
    }
    return fcPath;
  }

  /**
   * Lightweight filename-only ignore check for deleted-file detection.
   * Only applies non-negation patterns that don't contain "/" (e.g.
   * "*.pdf", "*.log"). Skips path-based patterns and negations because
   * deleted records have no folder context to evaluate them against.
   */
  function shouldIgnoreFileName(fileName, ignoredPaths) {
    if (!ignoredPaths || !Array.isArray(ignoredPaths)) return false;
    for (let i = 0; i < ignoredPaths.length; i++) {
      let pattern = ignoredPaths[i];
      // Skip negations — can't un-ignore without path context
      if (pattern.startsWith("!")) continue;
      // Strip leading slash
      if (pattern.startsWith("/")) pattern = pattern.slice(1);
      // Skip path patterns — only match filename globs
      if (pattern.includes("/")) continue;
      // Skip bare "*" — it would match everything, and without path
      // context we can't apply the negation re-includes that follow it
      if (pattern === "*") continue;

      const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, "[^/]*");
      if (new RegExp("^" + regexPattern + "$").test(fileName)) {
        return true;
      }
    }
    return false;
  }

  function shouldIgnorePath(filePath, ignoredPaths) {
    const fileName = filePath.split("/").pop() || "";

    let ignored = false;

    for (let pattern of ignoredPaths) {
      const isNegation = pattern.startsWith("!");
      if (isNegation) pattern = pattern.slice(1);

      // Strip leading slash BEFORE checking for filename-only pattern,
      // otherwise "/*" is seen as a path pattern (contains "/") instead
      // of the filename-only glob "*".
      if (pattern.startsWith("/")) {
        pattern = pattern.slice(1);
      }

      const isFilenamePattern = !pattern.includes("/");
      const target = isFilenamePattern ? fileName : filePath;

      let regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*\//g, "DOUBLE_STAR_SLASH")
        .replace(/\*\*/g, "DOUBLE_STAR")
        .replace(/\*/g, "[^/]*")
        .replace(/DOUBLE_STAR_SLASH/g, "(.*\\/)?")
        .replace(/DOUBLE_STAR/g, ".*");

      regexPattern = "^" + regexPattern + "$";

      const regex = new RegExp(regexPattern);
      const matches = regex.test(target);

      if (matches) {
        ignored = !isNegation;
      }
    }

    return ignored;
  }

  /**
   * Verifies whether a full folder path exists in the File Cabinet.
   * Example: "SuiteScripts/Cycle/test" → returns the internalid of "test"
   * If any folder in the path does not exist, returns null.
   */
  function getFolderIdByPath(fullPath) {
    try {
      const parts = fullPath.split("/").filter(Boolean);
      let parentId = null;

      for (const name of parts) {
        const filters = [["name", "is", name]];

        if (parentId) {
          // Search for folder with specific parent
          filters.push("AND", ["parent", "anyof", parentId]);
        } else {
          // Search for top-level folder
          filters.push("AND", ["istoplevel", "is", "T"]);
        }

        const results = search
          .create({
            type: "folder",
            filters: filters,
            columns: ["internalid"],
          })
          .run()
          .getRange({ start: 0, end: 1 });

        if (results && results.length > 0) {
          parentId = results[0].getValue({ name: "internalid" });
        } else {
          // Folder does not exist in this level → path incomplete
          return null;
        }
      }

      // Entire path exists → return id of the last folder
      return parentId;
    } catch (err) {
      logger.error("Error in getFolderIdByPath", {
        folderPath: fullPath,
        error: err.message,
        stack: err.stack,
      });
      return null; // Return null on error (treat as folder not found)
    }
  }
  /******************************** END HANDLERS ********************************/

  return {
    get: doGet,
    post: doPost,
  };
});
