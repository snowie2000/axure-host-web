export interface SelectFileOption {
  fileExt?: string[]
  multiple?: boolean
  restrictExt?: boolean // 严格限制文件类型，不允许选择所有文件
}
