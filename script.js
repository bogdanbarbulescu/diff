document.addEventListener('DOMContentLoaded', () => {
    // Input Elements
    const textInput1 = document.getElementById('text-input-1');
    const textInput2 = document.getElementById('text-input-2');
    const fileInput1 = document.getElementById('file1');
    const fileInput2 = document.getElementById('file2');
    const dropZone1 = document.getElementById('drop-zone-1');
    const dropZone2 = document.getElementById('drop-zone-2');
    const dropFeedback1 = document.getElementById('drop-feedback-1');
    const dropFeedback2 = document.getElementById('drop-feedback-2');

    // Control Elements
    const compareBtn = document.getElementById('compareBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusMsg = document.getElementById('status');

    // Output Elements
    const diffOutput1 = document.getElementById('diff-output-1');
    const diffOutput2 = document.getElementById('diff-output-2');
    const resultsSection = document.getElementById('results');

    // --- Helper: Read File Content ---
    const readFileContent = (file, targetTextArea, targetFeedback) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("No file provided."));
                return;
            }

            // Basic type check (optional but good practice for drag/drop)
            if (!file.type.startsWith('text/') &&
                !['application/json', 'application/xml', 'application/javascript', 'application/css', 'application/csv', 'text/markdown'].includes(file.type) &&
                !file.name.match(/\.(txt|text|log|csv|md|html|css|js|json|xml|yaml|ini)$/i))
             {
                targetFeedback.textContent = `Unsupported file type: ${file.name}`;
                // Don't reject necessarily, just warn and don't read
                resolve(false); // Indicate read didn't happen
                return;
            }


            const reader = new FileReader();
            targetFeedback.textContent = `Reading ${file.name}...`;
            targetTextArea.value = ''; // Clear previous content

            reader.onload = (event) => {
                targetTextArea.value = event.target.result;
                targetFeedback.textContent = `Loaded ${file.name}`;
                // Optionally clear feedback after a delay
                setTimeout(() => { targetFeedback.textContent = ''; }, 3000);
                resolve(true); // Indicate read success
            };

            reader.onerror = (event) => {
                console.error("File reading error:", event.target.error);
                targetFeedback.textContent = `Error reading ${file.name}`;
                targetTextArea.value = ''; // Clear on error
                reject(new Error(`Error reading ${file.name}`));
            };

            reader.readAsText(file); // Read as text
        });
    };

    // --- Event Listener Setup ---

    // 1. File Input (Browse Button)
    fileInput1.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            readFileContent(file, textInput1, dropFeedback1).catch(err => {
                statusMsg.textContent = `Error: ${err.message}`;
                statusMsg.className = 'status-message error';
            });
        }
         // Reset file input value so the same file can be re-selected
        event.target.value = null;
    });

    fileInput2.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            readFileContent(file, textInput2, dropFeedback2).catch(err => {
                 statusMsg.textContent = `Error: ${err.message}`;
                 statusMsg.className = 'status-message error';
            });
        }
        event.target.value = null;
    });

    // 2. Paste Event
    textInput1.addEventListener('paste', (event) => {
        // Optional: Clear feedback if pasting over dropped file message
        dropFeedback1.textContent = '';
        statusMsg.textContent = ''; // Clear general status
    });
    textInput2.addEventListener('paste', (event) => {
        dropFeedback2.textContent = '';
        statusMsg.textContent = '';
    });


    // 3. Drag and Drop Events
    const setupDragDrop = (dropZone, textArea, feedback) => {
        // Prevent default behavior for dragover and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Add visual feedback on dragover
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
                 feedback.textContent = 'Drop the file here!';
            }, false);
        });

        // Remove visual feedback on dragleave
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
             feedback.textContent = ''; // Clear feedback message
        }, false);

        // Handle the drop
        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('drag-over');
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length > 0) {
                const file = files[0]; // Process only the first file
                statusMsg.textContent = ''; // Clear general status
                readFileContent(file, textArea, feedback).catch(err => {
                     statusMsg.textContent = `Error: ${err.message}`;
                     statusMsg.className = 'status-message error';
                });
            } else {
                feedback.textContent = 'No file dropped.';
            }
        }, false);
    };

    setupDragDrop(dropZone1, textInput1, dropFeedback1);
    setupDragDrop(dropZone2, textInput2, dropFeedback2);

    // 4. Clear Button
     clearBtn.addEventListener('click', () => {
        textInput1.value = '';
        textInput2.value = '';
        fileInput1.value = null; // Reset file input
        fileInput2.value = null;
        diffOutput1.innerHTML = '';
        diffOutput2.innerHTML = '';
        resultsSection.style.display = 'none';
        statusMsg.textContent = 'Inputs cleared.';
        statusMsg.className = 'status-message';
        dropFeedback1.textContent = '';
        dropFeedback2.textContent = '';
        // Give focus back to the first input
        textInput1.focus();
     });

    // 5. Compare Button
    compareBtn.addEventListener('click', () => {
        statusMsg.textContent = 'Comparing text...';
        statusMsg.className = 'status-message'; // Reset style
        resultsSection.style.display = 'none'; // Hide old results
        diffOutput1.innerHTML = ''; // Clear previous diff
        diffOutput2.innerHTML = ''; // Clear previous diff

        const text1 = textInput1.value;
        const text2 = textInput2.value;

        // Basic check: Are both text areas non-empty? (Optional, depends on desired behavior)
        // if (!text1 || !text2) {
        //     statusMsg.textContent = 'Please provide text in both areas before comparing.';
        //     statusMsg.className = 'status-message error';
        //     return;
        // }

        try {
            // Use diff-match-patch
            const dmp = new diff_match_patch();
            // Increase deadline for potentially large inputs
            dmp.Diff_Timeout = 1; // Timeout in seconds (adjust as needed)

            const diffs = dmp.diff_main(text1, text2);

            // Improve readability
            dmp.diff_cleanupSemantic(diffs);
            // dmp.diff_cleanupEfficiency(diffs); // Optional further cleanup

            // Generate HTML for the diff views
            const display1 = generateDiffHtml(diffs, 1); // View for Text Area 1
            const display2 = generateDiffHtml(diffs, 2); // View for Text Area 2

            diffOutput1.innerHTML = display1;
            diffOutput2.innerHTML = display2;

            resultsSection.style.display = 'block'; // Show results
             if (display1 === '<span class="diff-equal"></span>' && display2 === '<span class="diff-equal"></span>' && text1 === text2 && text1 !== '') {
                 statusMsg.textContent = 'The texts are identical.';
             } else if (text1 === '' && text2 === '') {
                 statusMsg.textContent = 'Both text areas are empty.';
             }
             else {
                 statusMsg.textContent = 'Comparison complete.';
             }
            statusMsg.className = 'status-message';


        } catch (error) {
            console.error("Comparison error:", error);
            // Handle potential timeout errors from diff-match-patch
            if (error.message && error.message.includes("Timeout")) {
                 statusMsg.textContent = 'Error: Comparison timed out. The texts might be too large or too complex.';
            } else {
                 statusMsg.textContent = `Error: An unexpected issue occurred during comparison.`;
            }
            statusMsg.className = 'status-message error';
            resultsSection.style.display = 'none';
        }
    });

    // --- HTML Generation for Diff (Unchanged from previous version) ---
    function generateDiffHtml(diffs, outputPane) {
        let html = '';
        const DIFF_DELETE = -1;
        const DIFF_INSERT = 1;
        const DIFF_EQUAL = 0;

        if (!diffs || diffs.length === 0) {
             // Handle empty diff case, maybe resulting from identical empty inputs
             if (outputPane === 1 && textInput1.value === '') return '';
             if (outputPane === 2 && textInput2.value === '') return '';
              // If inputs were identical but not empty, DMP returns [[0, text]]
        }


        for (const [op, data] of diffs) {
            // Escape HTML special characters
            const text = data.replace(/&/g, '&')
                           .replace(/</g, '<')
                           .replace(/>/g, '>')
                           .replace(/"/g, '"');

            switch (op) {
                case DIFF_INSERT:
                    if (outputPane === 2) html += `<ins class="diff-add">${text}</ins>`;
                    break;
                case DIFF_DELETE:
                     if (outputPane === 1) html += `<del class="diff-del">${text}</del>`;
                    break;
                case DIFF_EQUAL:
                    // Avoid adding empty spans if the original text was truly empty
                    if (text.length > 0) {
                        html += `<span class="diff-equal">${text}</span>`;
                    } else if (diffs.length === 1) {
                         // Special case: if the only diff is [0, ""], output nothing visible
                         // This can happen if both inputs are identical empty strings
                         html = '';
                    } else {
                        // In other cases, an empty equal section might be meaningful
                        // (e.g., between an insertion and a deletion), but visually empty.
                         html += `<span class="diff-equal"></span>`;
                    }

                    break;
            }
        }
         // If after processing, html is just an empty equal span (from empty inputs), clear it.
         if (html === '<span class="diff-equal"></span>') {
             return '';
         }
        return html;
    }
});
