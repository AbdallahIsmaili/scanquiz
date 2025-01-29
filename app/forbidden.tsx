import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="text-red-600 font-semibold text-lg">
            Access Denied
          </button>
        </AlertDialogTrigger>

        <AlertDialogContent className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-red-600">
              Forbidden
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-gray-700">
              You are not authorized to access this resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex justify-between">
            <AlertDialogAction asChild>
              <Link href="/" className="text-blue-600 hover:text-blue-500">
                Return Home
              </Link>
            </AlertDialogAction>
            <AlertDialogCancel asChild>
              <button className="text-gray-500 hover:text-gray-700">
                Close
              </button>
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
