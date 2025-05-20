import importlib
import pkgutil
import inspect
import sys

def explore_package(package_name, indent="", max_depth=3, current_depth=0):
    """
    Explore a package and print its structure (modules, classes, functions).
    """
    if current_depth > max_depth:
        print(f"{indent}... (max depth reached)")
        return
    
    try:
        # Import the package
        package = importlib.import_module(package_name)
        print(f"{indent}📦 {package_name}")
        
        # Explore submodules/packages
        for _, name, is_pkg in pkgutil.iter_modules(package.__path__, package.__name__ + '.'):
            if is_pkg:
                explore_package(name, indent + "  ", max_depth, current_depth + 1)
            else:
                try:
                    module = importlib.import_module(name)
                    print(f"{indent}  📄 {name.split('.')[-1]}")
                    
                    # List top-level classes in the module
                    for cls_name, cls in inspect.getmembers(module, inspect.isclass):
                        if cls.__module__ == module.__name__:
                            print(f"{indent}    🔹 {cls_name}")
                    
                    # List top-level functions in the module
                    for func_name, func in inspect.getmembers(module, inspect.isfunction):
                        if func.__module__ == module.__name__:
                            print(f"{indent}    ⚡ {func_name}()")
                except Exception as e:
                    print(f"{indent}  ❌ Error importing {name}: {str(e)}")
        
        # Check for top-level attributes that might be of interest
        print(f"{indent}📊 Direct attributes of {package_name}:")
        for attr_name in dir(package):
            if not attr_name.startswith('_'):  # Skip private/dunder attributes
                try:
                    attr = getattr(package, attr_name)
                    if inspect.ismodule(attr):
                        continue  # Skip modules as they're already covered
                    
                    attr_type = type(attr).__name__
                    print(f"{indent}  🔸 {attr_name} ({attr_type})")
                except Exception as e:
                    print(f"{indent}  ❌ Error accessing {attr_name}: {str(e)}")
    
    except ModuleNotFoundError:
        print(f"{indent}❌ Package {package_name} not found")
    except Exception as e:
        print(f"{indent}❌ Error exploring {package_name}: {str(e)}")

if __name__ == "__main__":
    print("🔍 Exploring LiveKit SDK Structure 🔍")
    print("This will help us understand how to properly import LiveKit components.")
    print("-" * 60)
    
    # Explore the main livekit package
    explore_package("livekit")
    
    # Try to specifically look for RoomService and JobService
    print("\n🔎 Looking for RoomService and JobService:")
    found_room_service = False
    found_job_service = False
    
    # Check if we can import these classes directly (unlikely based on previous errors)
    try:
        from livekit import RoomService
        print("✅ RoomService can be imported directly from livekit")
        found_room_service = True
    except ImportError:
        print("❌ RoomService cannot be imported directly from livekit")
    
    try:
        from livekit import JobService
        print("✅ JobService can be imported directly from livekit")
        found_job_service = True
    except ImportError:
        print("❌ JobService cannot be imported directly from livekit")
    
    # Try to identify service modules from api
    try:
        import livekit.api
        print("\n🔍 livekit.api attributes:")
        for attr_name in dir(livekit.api):
            if not attr_name.startswith('_'):  # Skip private/dunder attributes
                try:
                    attr = getattr(livekit.api, attr_name)
                    attr_type = type(attr).__name__
                    print(f"  🔸 {attr_name} ({attr_type})")
                    
                    # If this is a module, try to get its attributes
                    if inspect.ismodule(attr):
                        print(f"    📋 Module contents:")
                        for sub_attr_name in dir(attr):
                            if not sub_attr_name.startswith('_'):
                                try:
                                    sub_attr = getattr(attr, sub_attr_name)
                                    sub_attr_type = type(sub_attr).__name__
                                    print(f"      🔹 {sub_attr_name} ({sub_attr_type})")
                                except Exception as e:
                                    print(f"      ❌ Error: {str(e)}")
                except Exception as e:
                    print(f"  ❌ Error accessing {attr_name}: {str(e)}")
    except ImportError:
        print("❌ Cannot import livekit.api")
    
    # Try to find how to create room service and job service instances
    print("\n💡 Let's see if we can inspect actual service creation:")
    try:
        import livekit
        
        # Try to find service factory functions or classes in likely places
        print("\n Looking for room_service and job_service related functionality...")
        if hasattr(livekit.api, 'room_service'):
            print(f"✅ Found livekit.api.room_service")
            rs = livekit.api.room_service
            # Try to inspect what's in room_service
            if hasattr(rs, 'RoomService'):
                print(f"  ✅ Found livekit.api.room_service.RoomService")
                rs_cls = rs.RoomService
                print(f"  📝 Signature: {inspect.signature(rs_cls.__init__)}")
        
        # Try common variations for job service
        for job_attr in ['job_service', 'jobs', 'job']:
            if hasattr(livekit.api, job_attr):
                print(f"✅ Found livekit.api.{job_attr}")
                js = getattr(livekit.api, job_attr)
                # Try to inspect what's in this attribute
                if hasattr(js, 'JobService'):
                    print(f"  ✅ Found livekit.api.{job_attr}.JobService")
                    js_cls = js.JobService
                    print(f"  📝 Signature: {inspect.signature(js_cls.__init__)}")
        
        # Try for JobService directly under api
        if hasattr(livekit.api, 'JobService'):
            print(f"✅ Found livekit.api.JobService directly")
            js_cls = livekit.api.JobService
            print(f"  📝 Signature: {inspect.signature(js_cls.__init__)}")
            
    except Exception as e:
        print(f"❌ Error inspecting service creation: {str(e)}")
    
    print("\n✨ Done exploring. Now you can see what's available in your livekit SDK.") 