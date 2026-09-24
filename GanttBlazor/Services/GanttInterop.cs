using Microsoft.JSInterop;

namespace GanttBlazor.Services;

/// <summary>
/// Interop bridge between Blazor C# and the existing Gantt JS app.
/// The gantt.html app runs in an iframe. This service can later be
/// wired to postMessage or direct JS interop calls into the iframe.
/// </summary>
public class GanttInterop(IJSRuntime jsRuntime)
{
    public async Task<string> GetTasksJsonAsync()
    {
        try
        {
            return await jsRuntime.InvokeAsync<string>("ganttInterop.getTasks");
        }
        catch
        {
            // iframe may not be loaded or JS bridge not yet wired
            return "";
        }
    }

    public async Task SaveTasksJsonAsync(string tasksJson)
    {
        try
        {
            await jsRuntime.InvokeVoidAsync("ganttInterop.saveTasks", tasksJson);
        }
        catch
        {
            // iframe may not be loaded or JS bridge not yet wired
        }
    }
}
